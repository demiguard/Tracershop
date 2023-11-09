#!/usr/bin/perl -w

require 5.001;
use strict;
use File::Copy;
use File::Find;
use File::Temp qw/ tempfile tempdir /;
use Time::gmtime;
use File::stat;
use DBI;
use DBD::mysql;
use Log::Log4perl;
use Log::Dispatch::Email;
use POSIX ":sys_wait_h";

use vars qw/*name *dir *prune/;
*name   = *File::Find::name;
*dir    = *File::Find::dir;
*prune  = *File::Find::prune;

our $host = "127.0.0.1";
our $local_port = "7777";
our $remote_port = "3306";

sub init_log {
    our $log_conf = q(
    log4perl.rootLogger = DEBUG, Email, Logfile, Screen

    log4perl.appender.Logfile                          = Log::Log4perl::Appender::File
    log4perl.appender.Logfile.filename                 = /var/log/dispenslabeld.log
    log4perl.appender.Logfile.mode                     = append
    log4perl.appender.Logfile.layout                   = PatternLayout
    log4perl.appender.Logfile.layout.ConversionPattern = %d [%p] %F{1}:%L %c - %m%n

    log4perl.appender.Screen        = Log::Log4perl::Appender::Screen
    log4perl.appender.Screen.stderr = 0
    log4perl.appender.Screen.layout = Log::Log4perl::Layout::SimpleLayout

    log4perl.appender.Email                          = Log::Dispatch::Email::MailSender
    log4perl.appender.Email.min_level                = error
    log4perl.appender.Email.buffered                 = 0
    log4perl.appender.Email.to                       = cralle@outlook.com
    log4perl.appender.Email.from                     = root@hopper.petnet.rh.dk
    log4perl.appender.Email.smtp                     = smtp-int.rh.dk
    log4perl.appender.Email.subject                  = Problem in dispenslabeld
    log4perl.appender.Email.layout                   = PatternLayout
    log4perl.appender.Email.layout.ConversionPattern = %d [%p] %F{1}:%L %c - %m%n

);
    Log::Log4perl::init(\$log_conf);
}

MAIN:
{
    # The minimum time a connection should be up before autossh will attempt to restart
    # it when it fails.
    if (not defined $ENV{'AUTOSSH_GATETIME'}) {
	$ENV{'AUTOSSH_GATETIME'} = 30;
    }

    init_log();
    my $logger = Log::Log4perl::get_logger("MAIN");

    # setup tunnel for tracershop
    my $pid = fork();
    if (not defined $pid) {
	$logger->fatal("Not enough resources to fork a new process");
	$logger->logdie();
    }
    elsif ($pid == 0) {
	# the child process runs the tunnel.
        # The connection is vital for the script, and we should try to
	# reestablish connection if it is lost
	my @args = ("autossh", "-M 20000", "-L $local_port:$host:$remote_port", "tracershop\@pet.rh.dk", "-N");
	$logger->info("Establishing connection to tracershop");
	system(@args);
	if ($? == 1) {
	    $logger->fatal("Unable to setup ssh tunnel");
	    $logger->logdie();
	}
	$logger->info("ssh tunnel shutdown\n");
	exit(0);
    }

# the rest of the script is the parent process and $pid is the child process id

    # Wait for tunnel to be set up. If autossh is unable to get a connection working
    # within AUTOSSH_GATETIME it exits.
    sleep($ENV{'AUTOSSH_GATETIME'} + 5);
    $logger->info("Main script running");
    while (1) {
	if (waitpid($pid, POSIX::WNOHANG) == $pid) {
	    # The tunnel is gone, this should only happen if
	    # it failed immediately or it was killed.
            # Otherwise autossh should continue to reestablish the connection
	    # In both cases we shutdown the script
	    $logger->fatal("The tunnel to tracershop is gone. Shutting down");
	    last;
	}
	# Traverse desired filesystems
	File::Find::find({wanted => \&wanted}, '/var/dispenser/input');
	File::Find::find({wanted => \&wantedbp}, '/var/dispenser/input');
	sleep 1;
    }
    # kill tunnel
    $logger->info("Shutting down");
    kill -9, getpgrp(); # Needed to kill the autossh
}

sub wanted {
    my ($dev,$ino,$mode,$nlink,$uid,$gid);

    /^VAL\..*\z/s &&
	(($dev,$ino,$mode,$nlink,$uid,$gid) = lstat($_)) &&
	-f _ &&
	move_print($File::Find::name);
}

sub wantedbp {
    my ($dev,$ino,$mode,$nlink,$uid,$gid);

    /^BP\.MES\z/s &&
	(($dev,$ino,$mode,$nlink,$uid,$gid) = lstat($_)) &&
	-f _ &&
	movebp_print($File::Find::name);
}

sub plot_BP {
    my $gnuplot = "/usr/bin/gnuplot";
    my ($fbpname,$nsamples,%bp_data) = @_;;
    my $samplerate;

    use File::Temp qw/ tempfile tempdir /;
    my ($fh, $filename) = tempfile( DIR => $dir );

    $samplerate = 1000 / $bp_data{samplerate};
    print $fh "set terminal postscript color\n";
    print $fh "set nokey\n";
    print $fh "set ylabel \"Tryk (bar)\" \n";
    print $fh "set xlabel \"Samplepoints\" \n";
    print $fh "set nokey\n";
    print $fh "set title \"Bubble Point / Filter Integrity Test \\n \\n \\\n";
    print $fh "Batch nr.: $bp_data{charge}  \\\n";
    print $fh "Dato: $bp_data{date}  \\\n";
    print $fh "Tidspunkt: $bp_data{time}\\n \\\n";
    print $fh "Duration: $bp_data{duration} sek.  \\\n";
    print $fh "Maksimum tryk: $bp_data{maxpress} bar \\\n";
    print $fh "Sample rate: $samplerate /sek. \\\n";
    print $fh "Antal samples: $bp_data{samplenumber}\"\n";
    print $fh "plot '-' smooth csplines with lines\n";
    `tail -$nsamples $fbpname >> $filename`;

    `$gnuplot $filename|lp -dhelene -oMedia=Plain`;
}

sub movebp_print {
    my($s) = @_;
    my ($st,$now,$tm,$r);
    my $print_dir = '/var/dispenser/BP';
    my $BP;
    my (%bp_data);


    $st = stat($s);
    $now = time();
    $tm = gmtime($now - $st->mtime);
    if ($tm->sec() >= 1) {

	open(UPFILE, "<$s");
	while (<UPFILE>) {
	    if (/^(\w+):\s+(.*)$/) {
		$bp_data{$1} = $2;
		chop ($bp_data{$1});
	    }
	}
	$BP = "$print_dir/BP_$bp_data{'date'}_$bp_data{'time'}";
	move($s,$BP);
	close (UPFILE);
	plot_BP($BP, $bp_data{samplenumber}, %bp_data);
	$r = 1;
    }
    else {
	$r = 0;
    }
    return $r;
}

sub move_print  {
    my($s) = @_; #VAL file name
    my $scp_output = `scp $s gfr2:/mnt/vials`;
    my $print_dir = '/var/dispenser/print';
    my $VAL = "$print_dir/$_";

    my $glabels_batch = '/usr/bin/glabels-batch';
    my $ydre_glabels2 = "/var/dispenser/ydre_zlabel_text.glabels";

    my $label_reverse_string = "/var/dispenser/levin_reverse";
    my $label_print_raw = 'lp -dlevin_raw';
    my $label_print_string = 'lp -dlevin -o Media=Preprinted';
    my $label_outfile = "/var/dispenser/ydrelabel.txt";

    my $delivery_note_printer_string = "|lp -n 3 -djulie -o Media=Plain";
    my $transport_note_printer_string = "|lp -n 2 -djulie -o Media=Plain"; #julie

    my %vial_data;
    my $result;

    my $logger = Log::Log4perl::get_logger("move_print");

    $logger->info("processing file: $s");

    # If its a new file, move it to the print directory and print it
    my $st = stat($s);
    my $now = time();
    my $tm = gmtime($now - $st->mtime);
    if ($tm->sec() >= 1) {
	$logger->debug("Moving file $s");
	move($s,$print_dir);

	%vial_data = parse_VAL($VAL);

	# Quick hack to correct filldate, if we get a date that is d.m.yy instead of dd.mm.yy
	$vial_data{'filldate'} =~ /((\d{1,2})\.(\d{1,2})\.(\d\d))/;
	my $fill_day = sprintf("%02d", $2);
	my $fill_month = sprintf("%02d", $3);
	my $fill_year = $4;
	$vial_data{'filldate'} = "$fill_day.$fill_month.$fill_year";
	# End of hack ;-)

	$vial_data{'filldate'} =~ /((\d\d)\.(\d\d)\.(\d\d))/;
	my $cdate = "$2/$3/$4";

	my $customer;
	if ($vial_data{'customer'} =~ /(\d\d?)\w*/){
	    $customer = $1;
	}
	else {
	    $customer = 0;
	}

	# insert VAL data in DB and get the customer info from DB
	my %customer_info;
	eval {
	    %customer_info = insert_VAL_in_DB($customer, %vial_data);
	    1;
	} or do {
	    $logger->error("Could not insert VAL in DB");
	    return -1;
	};

	# We want labels from hotlab UK465 printed on krogsgaard
	if (exists($vial_data{'dispenser'}) && $vial_data{'dispenser'} eq "UK465") {
	    $logger->info("Printing labels on krogsgaard");
	    $label_print_string = 'lp -dkrogsgaard -o Media=Preprinted';
	    $label_reverse_string = "/var/dispenser/levin_reverse"; # reverse strings are identical
	    $label_print_raw = 'lp -dkrogsgaard_raw';
	}
	else {
	    $logger->info("Printing labels on levin");
	}

	# ser label printer in reverse mode 
	`$label_print_raw $label_reverse_string`;


	# print labels
	my $batch = $vial_data{'charge'};
	$batch =~ s/:/-/g; #Why

	$vial_data{'filltime'} =~ /(\d\d):(\d\d):(\d\d)/;
	my $filltime = $1 . ':' . $2;

	my $exptime = ($1 + 10)%24 . ':' . $2;
	if (exists($vial_data{'use_before'})) {
	    $vial_data{'use_before'} =~ /\d\d\/\d\d\/\d\d (\d\d):(\d\d)/;
	    $exptime = $1 . ':' . $2;
	 #  $vial_data{'syntesis'}   =~ /\d\d\d\d\/\d\d\/\d\d (\d\d):(\d\d)/;
	}

	$vial_data{'activity'} =~ /(\d+\.?\d*)( MBq)/;
	my $activity = int($1) . $2;

	open (OUT,">$label_outfile");
	print OUT "$customer_info{'shortname'},$cdate,$batch,$activity,$vial_data{volume},$filltime,$exptime";
	close (OUT);
	
	my $glabels_out;
	(undef,$glabels_out) = tempfile(SUFFIX => '.ps',DIR => $print_dir, OPEN => 0);
	`$glabels_batch $ydre_glabels2 -c 3 --output=$glabels_out`;
	`$label_print_string $glabels_out`;
	if ( -f $glabels_out) {
	    unlink ($glabels_out)
	}
	
	
	if ($customer != 01) {
	    #print_reports
	    open(REPORT, $delivery_note_printer_string) || do {
		$logger->error("Couldn't open printing pipe for packinglist");
		return -1;
	    };
	    format REPORT=
			F � L G E S E D D E L

							Dato: @<<<<<<<<
$cdate
	Modtager:

	  @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$customer_info{'title'}
	  @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$customer_info{'addr1'}
	  @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$customer_info{'addr2'}
	  @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$customer_info{'addr3'}
          @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$customer_info{'addr4'}


        Afsender:

          PET- og Cyklotronenheden, KF-3982
          Rigshospitalet
          Blegdamsvej 9, 2100 KBH �			
          Telefon: +45 3545 3949
          Fax: +45 3545 3898




        Indhold:          Radioaktivt l�gemiddel
                          Fludeoxyglucose [18F] injektion (DK R14)
        Origin            DK
        Batch nr.:        @<<<<<<<<<<<<<
$batch
        Aktivitet:        @<<<<<<<<<< @ kl @<<<<<
$vial_data{activity},"@",$filltime
        Volume:           @<<<<<<<
$vial_data{volume}







	
	Det attesteres hermed at produktet er fremstillet, analyseret
	og pakket p� ovenn�vnte site i fuld overensstemmelse med kravene
	til GMP og g�ldende markedsf�ringstilladelse.

        BEM�RK: Produktet m� under ingen omst�ndigheder anvendes til
        humant brug f�r man har modtaget godkendelse pr. email eller
        telefax.

        P.v.a. Nic Gillings, QP


                              Signatur: ................................



	


.

      write REPORT;
      close (REPORT);

      ### Begyndelsen p� Transportdokumentet ###
      open(REPORT_TRANS, $transport_note_printer_string) || do {
        $logger->error("Couldn't open printing pipe for packinglist");
        return -1;
      };


      format REPORT_TRANS=
		T R A N S P O R T D O K U M E N T
		
	   for vejtransport af farligt gods, klasse 7                        


                                                        Dato: @<<<<<<<<
$cdate
        Modtager:

          @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$customer_info{'title'}
	  @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$customer_info{'addr1'}
	  @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$customer_info{'addr2'}
	  @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$customer_info{'addr3'}
          @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
$customer_info{'addr4'}


        Afsender:

          PET- og Cyklotronenheden, KF-3982
          Rigshospitalet
          Blegdamsvej 9, 2100 KBH �
          Telefon: +45 3545 3949
          Fax: +45 3545 3898


	Denne forsendelse omfatter 1 kolli, for hvilke nedenst�ende 
	oplysninger g�lder.

	UN-2915 RADIOAKTIVT STOF, TYPE A KOLLI, ikke-speciel form, 
	ikke-fissilt eller undtaget-fissilt, 7.


        Radioaktivt stof:	F-18
        Fysisk-kemisk form:	V�ske
        Aktivitet:		@<<<<<<<<<< @ kl @<<<<<
$vial_data{activity},"@",$filltime
        Kollikategori:		II-GUL
	Transportindeks:	< 1.0



	Ved uheld ring straks til "Statens Institut for Str�lebeskyttelse", 
	tlf. +45 4494 3773 og f�lg instrukserne i udleveret sikkerhedsinstruks.



	Ved sp�rgsm�l om transporten, kontakt PET-og Cyklotronenheden p� 
	tlf. +45 3545 3949.





        P.v.a. ansvarlig leder Holger Jensen


                              Dato og signatur: ................................






.

      write REPORT_TRANS;
      close (REPORT_TRANS);
      }
    $result = 1;
  }
  else {
    $result = 0;
  }
  return $result;
}

# parses a file with <key>:<value> mappings and return the resulting hashtable
sub parse_VAL {
    my($VAL) = @_;
    my %vial_data;

    open(UPFILE, "<$VAL");
    while (<UPFILE>) {
	if (/^(\w+):\s+(.*)$/) {
	    $vial_data{$1} = $2;
	    chop ($vial_data{$1});
	}
    }
    close (UPFILE);

    return %vial_data;
}


## load customer from tracershop database
# OUTLINE:
# - setup ssh tunnel
# - connect to database
# - fetch customer
# - insert VAL data
# - disconnect
# - close tunnel

sub insert_VAL_in_DB {
    my($customer, %vial_data) = @_;

    # database connection parameters
    my $platform = "mysql";
    my $database = "TracerShop";
    my $tablename = "Users";
    my $user = "tracershop";
    my $pw = "fdg4sale";

    my $logger = Log::Log4perl::get_logger("insert_VAL_in_DB");

    # data source name
    my $dsn = "dbi:$platform:$database:$host:$local_port";

    # connect to the database
    my $dbtracershop = DBI->connect($dsn,$user,$pw) or do {
	$logger->error("Unable to connect: $DBI::errstr");
	$logger->logdie();
    };


    #  find customer
    my $query = qq{SELECT Shortname,title,addr1,addr2,addr3,addr4 FROM $tablename WHERE Kundenr = $customer};
    my $query_handle = $dbtracershop->prepare($query);
    $query_handle->execute() or do {
	$logger->error("Unable to execute: $DBI::errstr");
	$logger->logdie();
    };

    # check for existence and uniqueness of the customer
    if ($query_handle->rows == 0) {
	$logger->error("No matches found for Kundenr $customer");
	$logger->logdie();
    } elsif ($query_handle->rows > 1) {
	$logger->error("More than one customer with Kundenr $customer");
	$logger->logdie();
    }
    
    # fetch customer
    my ($shortname,$title,$addr1,$addr2,$addr3,$addr4);
    $query_handle->bind_columns(\$shortname,\$title,\$addr1,\$addr2,\$addr3,\$addr4);
    $query_handle->fetch();
    $query_handle->finish();
    my %customer_info = ('shortname', $shortname,
			 'title', $title,
			 'addr1', $addr1,
			 'addr2', $addr2,
			 'addr3', $addr3,
			 'addr4', $addr4);
    
    # insert val data into database
    my ($charge,$depotpos, $filldate, $filltime, $activity, $volume, $gros, $tare, $net, $product);
    $charge = $vial_data{'charge'};
    $charge =~ s/:/-/g;
    $depotpos = $vial_data{'depotpos'};
    $vial_data{'filldate'} =~ /((\d\d)\.(\d\d)\.(\d\d))/;
    $filldate = "20$4-$3-$2";
    $filltime = $vial_data{'filltime'};
    $vial_data{activity} =~ /(\d+\.?\d*)( MBq)/;
    $activity = $1;
    $vial_data{volume} =~ /(\d+\.?\d*)( ml)/;
    $volume = $1;
    $vial_data{gros} =~ /(\d+\.?\d*)( g)/;
    $gros = $1;
    $vial_data{tare} =~ /(\d+\.?\d*)( g)/;
    $tare = $1;
    $vial_data{net} =~ /(\d+\.?\d*)( g)/;
    $net = $1;
    $product = $vial_data{'product'};

    $dbtracershop->do("INSERT INTO VAL  (customer,
             		             charge,
                        	     depotpos,
                                     filldate,
                                     filltime,
                                     activity,
                                     volume,
                                     gros,
                                     tare,
                                     net,
                                     product)
        VALUES (" . $dbtracershop->quote($customer)   . ","  
		      . $dbtracershop->quote($charge)     . ","
		      . $dbtracershop->quote($depotpos)   . ","
		      . $dbtracershop->quote($filldate)   . ","
		      . $dbtracershop->quote($filltime)   . ","
		      . $dbtracershop->quote($activity)   . ","
		      . $dbtracershop->quote($volume)     . ","
		      . $dbtracershop->quote($gros)       . ","
		      . $dbtracershop->quote($tare)       . ","
		      . $dbtracershop->quote($net)        . ","
		      . $dbtracershop->quote($product) . ")");


    # disconnect from database
    $dbtracershop->disconnect();
    

    return %customer_info;
}
