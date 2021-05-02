export { CalenderFactory }

// It's important to know that JS is really fucking stupid about dates
// AKA the month number for jan is 0. So yeah.
// At the same time the 1 of a month is the first of a month
// aka The date 01/01/2020 is Date = 1 month = 0, Year = 2020


class CalenderFactory {
  //Helper Functions
  remove_weekdays() {
    var weekdivs = $(".weekrow");
    for (let i = 0; i < weekdivs.length; i++) {
      const div = weekdivs[i];
      div.parentNode.removeChild(div);
    }
  };
  
  DaysInAMonth(year, month){
    return new Date(year, month,0).getDate();
  };

  SetActiveDate(Date) {
    this.activeDate = Date;
  }

  LastmondayInLastMonth(year,month){
    var pivot = 1;
    var pivotDate = new Date(year, month, pivot);
    while(pivotDate.getDay() != 0){
      pivot--;
      pivotDate = new Date(year, month, pivot);
    }
    return pivot;
  };

  FirstSundayInNextMonth(year,month){
    var pivot = this.DaysInAMonth(year, month);
    var pivotDate = new Date(year, month, pivot);
    while(pivotDate.getDay() != 6){
      pivot++;
      pivotDate = new Date(year, month, pivot);
    }
    return pivot;
  };

  
  //End helper functions

  constructor(
      div,
      today,
      date_coloring_function,
      date_onClick_function, 
      month_api_function,
      date_status
      //dateOnClickFunction
    ){ 
    this.month_api_function = month_api_function;
    this.today = today;
    this.activeDate = today;
    this.date_coloring_function = date_coloring_function;
    this.date_onClick_function = date_onClick_function;
    this.date_status = date_status;
    this.main_div = $('#'+div);
    //this.dateOnClickFunction;
    this.Updating = false;

    if(!(this.main_div.length)){
      console.log("The target div does not exists: usage: divID");
      return;
    }
    this.main_div.addClass('calender');

    this.headDiv = document.createElement("div");
    this.headDiv.classList.add('calender-header');
    this.headDiv.classList.add('flex-row');
    this.headDiv.classList.add('d-flex');
    this.headDiv.classList.add('justify-content-around');
    this.prevDiv = document.createElement("div");
    this.nextDiv = document.createElement("div");
    this.monthDiv = document.createElement("div");
    var jPrevDiv = $(this.prevDiv);
    var jNextDiv = $(this.nextDiv);

    jPrevDiv.on('click', () => {
      this.change_month(-1);
    });
    jNextDiv.on('click', () => {
      this.change_month(1);
    });
    

    this.prevDiv.innerHTML = "<img src=/static/customer/images/prev.svg height=28px >";
    this.monthDiv.innerText = this.today.toLocaleString('default', {month:'long'});
    this.nextDiv.innerHTML = "<img src=/static/customer/images/next.svg height=28px >";

    this.headDiv.append(this.prevDiv);
    this.headDiv.append(this.monthDiv);
    this.headDiv.append(this.nextDiv);

    this.main_div.append(this.headDiv);
    
    this.datesdiv = document.createElement("div");
    this.datesdiv.classList.add('calender-dates');
    this.datesdiv.classList.add('d-flex');
    var Dates = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];
    Dates.forEach(datestr => {
      var datediv = document.createElement('div');
      datediv.classList.add("calender-row");
      datediv.innerText = datestr;
      this.datesdiv.append(datediv);
    });
    this.main_div.append(this.datesdiv);

    this.create_weekdays(this.today.getFullYear(), this.today.getMonth());
    
  };  

  create_weekdays(year, month) {
    var startingDate = this.LastmondayInLastMonth(year, month);    
    var EndingDate = this.FirstSundayInNextMonth(year, month);

    while (startingDate <= EndingDate) {
      var weekDiv = document.createElement("div");
      weekDiv.classList.add("d-flex");
      weekDiv.classList.add("weekrow");
      // Create a week
      for (let pivotday = startingDate; pivotday < startingDate + 7; pivotday++) {
        var dayDiv = document.createElement("div");
        dayDiv.classList.add('calender-row');
        var day = new Date(year, month, pivotday);
        
        
        if (day.getUTCDate() == this.activeDate.getUTCDate() && day.getMonth() == this.activeDate.getMonth()) {
          dayDiv.classList.add('today')
        }
        var day_str = String(day.getFullYear()) + "-";
        
        if (day.getMonth() < 9) {
          day_str += "0" + String(day.getMonth() + 1) + "-";
        } else {
          day_str += String(day.getMonth() + 1) + "-";
        } 
        if (day.getDate() < 10) {
          day_str += "0" + String(day.getDate());
        } else {
          day_str += String(day.getDate());
        }
        this.date_coloring_function(dayDiv, day_str, this.date_status);
        //$(dayDiv).click(this.dateOnClickFunction)
        this.date_onClick_function(dayDiv, day, this);
        dayDiv.innerText = day.getDate();
        weekDiv.append(dayDiv);
      }
      startingDate += 7;
      this.main_div.append(weekDiv);
    }
  };

  
  //Activated when next month button is clicked
  change_month(change_by) {
    if (this.Updating) return;
    this.Updating = true;
    const parentObj = this 
    this.remove_weekdays();
    var year  = this.today.getFullYear();
    var month = this.today.getMonth() + change_by;

    this.today = new Date(year, month, 1);
    //This is the easiest way to not think about conversion of dates
    var month = this.today.getMonth();
    var year  = this.today.getFullYear();
    
    this.monthDiv.innerText = this.today.toLocaleString('default', {month:'long'});
    var parent = this
    
    var api_call = this.month_api_function(year, month)
    $.get(api_call).then(function(data) {
      parent.date_status = data;
      parent.create_weekdays(year, month);
      parentObj.Updating=false;
    });
  }
  };
