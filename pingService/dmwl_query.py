from pydicom.dataset import Dataset

from pynetdicom import AE
from pynetdicom.sop_class import ModalityWorklistInformationFind
import mysql.connector
from datetime import datetime, timedelta
import math

def get_delay(identifier,mdb):
        cursor = mdb.cursor()
        mySql_insert_query = "SELECT delay FROM RequestedProcedureDescription WHERE rpd = %s"
        recordTuple = (identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepDescription,)
        cursor.execute(mySql_insert_query, recordTuple)
        result = cursor.fetchall()

        if result:
            return result[0][0]
        else:
            return 0

def get_tracer(identifier,mdb):
    cursor = mdb.cursor()
    mySql_insert_query = "SELECT tracer_id FROM RequestedProcedureDescription WHERE rpd = %s"
    recordTuple = (identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepDescription,)
    cursor.execute(mySql_insert_query, recordTuple)
    result = cursor.fetchall()
    if result:
        return result[0][0]
    else:
        return 0

def get_tracer_name(identifier,mdb):
    cursor = mdb.cursor()
    mySql_query = "SELECT tracers.tracer FROM tracers INNER JOIN RequestedProcedureDescription USING (tracer_id) WHERE rpd = %s"
    recordTuple = (identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepDescription,)
    cursor.execute(mySql_query, recordTuple)
    result = cursor.fetchall()

    if result:
        return result[0][0]
    else:
        return 0
#def get_dose(identifier):

def update_procedureStepDescription(identifier,mdb):
    cursor = mdb.cursor()
    mySql_insert_query = """INSERT IGNORE INTO RequestedProcedureDescription (rpd, tracer_id, delay, status) VALUES (%s, %s, %s, %s) """
    recordTuple = (identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepDescription,
                   0,0,0)
    cursor.execute(mySql_insert_query, recordTuple)
    mdb.commit()

def get_viallocation(dentifier,mdb):
    cursor = mdb.cursor()
    mySql_insert_query = "SELECT viallocation FROM kunde WHERE location = %s"
    recordTuple = (identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepLocation,)
    cursor.execute(mySql_insert_query, recordTuple)
    result = cursor.fetchall()
    if result:
        return result[0][0]
    else:
        return 0

def insert_booking(identifier,mdb):
    cursor = mdb.cursor()
    mySql_insert_query = """REPLACE INTO booking (accessionnr, tracer, startdate, starttime, injdate, injtime, location, viallocation, dose1, dose2, rpd) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)  """
    tracer = get_tracer_name(identifier,mdb)
    sd = identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepStartDate
    st = identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepStartTime
    startdatetime = datetime.strptime(sd+st, '%Y%m%d%H%M%S')
    injdatetime = startdatetime + timedelta(minutes=get_delay(identifier,mdb))
    if tracer=='18-F-FDG':
        dose = get_dose(identifier,injdatetime)
    else:
        dose=(0,0)
    viallocation = get_viallocation(identifier,mdb)

    recordTuple = (identifier.RequestedProcedureID,
                   tracer,
                   identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepStartDate,
                   identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepStartTime,
                   injdatetime.date(),
                   injdatetime.time(),
                   identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepLocation,
                   viallocation,
                   dose[0],
                   dose[1],
                   identifier.ScheduledProcedureStepSequence[0].ScheduledProcedureStepDescription)
    cursor.execute(mySql_insert_query, recordTuple)
    mdb.commit()

def get_dose(identifier,injdatetime):
    def decay_correct(t):
        halftime=6586
        base_dose = 400
        return base_dose*math.exp((math.log(2)/halftime)*t)

    FMT = '%H%M%S'
    injtime = datetime.strptime(injdatetime.strftime(FMT), FMT)
    dose1_time = datetime.strptime('081500', FMT)
    dose2_time = datetime.strptime('113000', FMT)
    tdelta1 = (injtime - dose1_time).total_seconds()
    tdelta2 = (injtime - dose2_time).total_seconds()
    dose = (decay_correct(tdelta1), decay_correct(tdelta2))
    return dose

def update_production_doses(mdb):
    def tracer_dose_total(mdb,kunde):
        mySql_query = """ SELECT COALESCE(SUM(dose1),0) AS sumdose FROM booking where viallocation=%s and injdate = %s AND injtime < %s UNION ALL SELECT COALESCE(SUM(dose2),0) AS sumdose FROM booking where viallocation=%s and injdate = %s AND injtime >= %s """
        recordTuple = (kunde,injdate[0],'11:30',kunde, injdate[0],'11:30')
        cursor.execute(mySql_query, recordTuple)
        result_doses = cursor.fetchall()
        mySql_query = """INSERT INTO tracer_dose_total (time1, time2, dose1, dose2, pdate, kunde) VALUES (%s, %s, %s, %s, %s, %s)  """
        recordTuple = ('08:15','11:30',result_doses[0][0],result_doses[1][0],injdate[0],kunde)
        cursor.execute(mySql_query, recordTuple)
        mdb.commit()

    cursor = mdb.cursor()
    mySql_query = """DELETE FROM tracer_dose_total"""
    cursor.execute(mySql_query)
    mySql_query = """SELECT DISTINCT injdate FROM booking where tracer='18-F-FDG' ORDER BY INJDATE  """
    cursor.execute(mySql_query)#, recordTuple)
    result_dates = cursor.fetchall()
    for injdate in result_dates:
        tracer_dose_total(mdb,'petrh')
        tracer_dose_total(mdb,'petf2')
        tracer_dose_total(mdb,'kf')


def clean_bookings(mdb):
    cursor = mdb.cursor()
    mySql_query = """delete from booking where injdate <= %s  """
    recordTuple = (datetime.today().date(),)
    cursor.execute(mySql_query, recordTuple)
    mdb.commit()


mydb = mysql.connector.connect(
    host='localhost',
    user='tracerbook',
    passwd='tb',
    database='tracerbooking'
)

# Initialise the Application Entity
ae = AE()

# Add a requested presentation context
ae.add_requested_context(ModalityWorklistInformationFind)

# Create our Identifier (query) dataset
ds = Dataset()
#ds.PatientName = '*'
ds.ScheduledProcedureStepSequence = [Dataset()]
item = ds.ScheduledProcedureStepSequence[0]
item.ScheduledStationAETitle = 'RHKFATBUK561'
item.ScheduledProcedureStepStartDate = datetime.strftime(datetime.today()+timedelta(days=1), '%Y%m%d')+'-'
item.ScheduledProcedureStepLocation = ''
# item.Modality = 'CT'

# Associate with peer AE at IP 127.0.0.1 and port 11112
#ae.ae_title='VIPCM'
assoc = ae.associate('10.143.10.158', 3320, None, 'VIPCM')

if assoc.is_established:
    # Use the C-FIND service to send the identifier
    responses = assoc.send_c_find(
        ds,
        ModalityWorklistInformationFind
    )
    clean_bookings(mydb)

    for (status, identifier) in responses:
        if status:
#            print('C-FIND query status: 0x{0:04x}'.format(status.Status))
            # If the status is 'Pending' then identifier is the C-FIND response
            if status.Status in (0xFF00, 0xFF01):
                update_procedureStepDescription(identifier,mydb)
                insert_booking(identifier,mydb)

        else:
            print('Connection timed out, was aborted or received invalid response')
    update_production_doses(mydb)
    # Release the association
    assoc.release()
else:
    print('Association rejected, aborted or never connected')
