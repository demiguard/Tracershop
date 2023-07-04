import { DEADLINE_TYPES, INJECTION_USAGE, JSON_ACTIVITY_ORDER, JSON_CUSTOMER, JSON_DEADLINE, JSON_DELIVER_TIME, JSON_EMPLOYEE, JSON_ENDPOINT, JSON_INJECTION_ORDER, JSON_ISOTOPE, JSON_PRODUCTION, JSON_SERVER_CONFIG, JSON_TRACER, JSON_TRACER_MAPPING, JSON_VIAL, TRACER_TYPE_ACTIVITY, TRACER_TYPE_DOSE } from "../lib/constants"


export const AppState = {}

AppState[JSON_ACTIVITY_ORDER] = new Map([
    [1, {
        id : 1,
        ordered_activity : 12345,
        delivery_date : "2020-05-04", // That's Monday
        status : 1,
        comment : "Test comment",
        ordered_time_slot : 1,
        moved_to_time_slot : null,
        freed_datetime : null,
        ordered_by : null,
        freed_by : null,
    }],
    [2, {
        id : 2,
        ordered_activity : 62345,
        delivery_date : "2020-05-04", // That's Monday
        status : 1,
        comment : "",
        ordered_time_slot : 2,
        moved_to_time_slot : 1,
        freed_datetime : null,
        ordered_by : null,
        freed_by : null,
    }], [3, {
        id : 3,
        ordered_activity: 22345,
        delivery_date: "2020-04-27", // That's Monday
        status: 3,
        comment: null,
        ordered_time_slot: 1,
        moved_to_time_slot: null,
        freed_datetime: "2020-05-04T",
        ordered_by: null,
        freed_by: null,
    }], [4, {
        id : 4,
        ordered_activity : 62345,
        delivery_date : "2020-05-04", // That's Monday
        status : 1,
        comment : "",
        ordered_time_slot : 2,
        moved_to_time_slot : 1,
        freed_datetime : null,
        ordered_by : null,
        freed_by : null,
    }]
])

AppState[JSON_CUSTOMER] = new Map([
    [1, {
        id : 1,
        short_name : "Customer_1",
        long_name : "Customer_long_name_1",
        dispenser_id : 1,
        billing_address : null,
        billing_city : null,
        billing_email : null,
        billing_phone : null,
        billing_zip_code : null,
        active_directory_code : null, // Drop this keyword?
    }],
    [2, {
        id : 2,
        short_name : "Customer_2",
        long_name : "Customer_long_name_2",
        dispenser_id : 2,
        billing_address : null,
        billing_city : null,
        billing_email : null,
        billing_phone : null,
        billing_zip_code : null,
        active_directory_code : null,
    }], [3 , {
        id : 3,
        short_name : "Customer_3",
        long_name : "Customer_long_name_3",
        dispenser_id : 3,
        billing_address : null,
        billing_city : null,
        billing_email : null,
        billing_phone : null,
        billing_zip_code : null,
        active_directory_code : null,
    }],
])

AppState[JSON_DEADLINE] = new Map([
    [1, {
        id : 1,
        deadline_type : DEADLINE_TYPES.DAILY,
        deadline_time : "12:00:00",
        deadline_day : null,
    }], [2, {
        id : 2,
        deadline_type : DEADLINE_TYPES.WEEKLY,
        deadline_time : "12:00:00",
        deadline_day : 3,
    }], [3, {
        id : 3,
        deadline_type : DEADLINE_TYPES.WEEKLY,
        deadline_time : "14:00:00",
        deadline_day : 1,
    }]
])

AppState[JSON_DELIVER_TIME] = new Map([
    [1, {
        id : 1,
        weekly_repeat : 1,
        delivery_time : "08:15:00",
        destination : 1,
        production_run : 1, // Tracer 1, Monday, 06:00
        expiration_date : null,
    }],
    [2, {
        id : 2,
        weekly_repeat : 1,
        delivery_time : "15:15:00",
        destination : 1,
        production_run : 2, // Tracer 1, Monday, 10:30
        expiration_date : null,
    }],
    [3, {
        id : 3,
        weekly_repeat : 1,
        delivery_time : "09:15:00",
        destination : 5,
        production_run : 2, // Tracer 3, Monday, 06:00
        expiration_date : null,
    }],
])

AppState[JSON_ENDPOINT] = new Map([
    [1, {
        id : 1,
        address : "Does Exists Street 3",
        city : "Imagine stand",
        zip_code : "9999",
        name : "endpoint_1_c1",
        owner : 1,
    }], [2, {
        id : 2,
        address : "Does Exists Street 4",
        city : "Imagine stand",
        zip_code : "9999",
        name : "endpoint_2_c1",
        owner : 1,
    }], [3, {
        id : 3,
        address : "Does Exists Street 5",
        city : "Imagine stand",
        zip_code : "9999",
        name : "endpoint_1_c2",
        owner : 2,
    }], [4, {
        id : 4,
        address : "Does Exists Street 6",
        city : "Imagine stand",
        zip_code : "9999",
        name : "endpoint_1_c3",
        owner : 3,
    }],
])

AppState[JSON_INJECTION_ORDER] = new Map([
    [1, {
        id : 1,
        delivery_time : "09:00:00",
        delivery_date : "2020-05-04",
        injections : 1,
        status : 1,
        tracer_usage : 1,
        comment : null,
        ordered_by : null,
        endpoint : 1,
        tracer : 2,
        lot_number : null,
        freed_datetime : null,
        freed_by : null,
    }], [2, {
        id : 2,
        delivery_time : "10:00:00",
        delivery_date : "2020-05-04",
        injections : 1,
        status : 2,
        tracer_usage : 1,
        comment : null,
        ordered_by : null,
        endpoint : 1,
        tracer : 2,
        lot_number : null,
        freed_datetime : null,
        freed_by : null,
    }], [3, {
        id : 3,
        delivery_time : "10:00:00",
        delivery_date : "2020-05-04",
        injections : 1,
        status : 3,
        tracer_usage : 1,
        comment : null,
        ordered_by : null,
        endpoint : 1,
        tracer : 2,
        lot_number : null,
        freed_datetime : null,
        freed_by : null,
    }],

])

AppState[JSON_ISOTOPE] = new Map([
    [1, {
        id :  1,
        atomic_number :  56,
        atomic_mass : 139,
        halflife_seconds : 83.06 * 60,
        atomic_letter : "Ba",
    }], [2,{
        id : 2,
        atomic_number : 92,
        atomic_mass : 235,
        halflife_seconds : 703800000 * 31556926, // Nuclear weapons doesn't make for good tracers
        atomic_letter : "U"
    }], [ 3, {
        id : 3,
        atomic_number : 43,
        atomic_mass : 99,
        halflife_seconds : 6.0067 * 3600,
        atomic_letter : "Tc"
    }],
]);

AppState[JSON_PRODUCTION] = new Map([
    [1, {
        id : 1,
        production_day : 0,
        tracer : 1,
        production_time : "06:00:00",
        expiration_date : null,
    }], [2, {
        id : 2,
        production_day : 0,
        tracer : 1,
        production_time : "10:30:00",
        expiration_date : null,
    }], [3, {
        id : 3,
        production_day : 1,
        tracer : 1,
        production_time : "06:00:00",
        expiration_date : null,
    }], [4, {
        id : 4,
        production_day : 1,
        tracer : 1,
        production_time : "10:30:00",
        expiration_date : null,
    }], [5, {
        id : 5,
        production_day : 0,
        tracer : 3,
        production_time : "07:00:00",
        expiration_date : null,
    }], [6, {
        id : 6,
        production_day : 0,
        tracer : 3,
        production_time : "11:30:00",
        expiration_date : null,
    }]
]);

AppState[JSON_SERVER_CONFIG] = new Map([
    [1, {
        id : 1,
        ExternalDatabase : null,
        SMTPServer : null,
        DateRange : 32,
        AdminPhoneNumber : "+45 80808080",
        AdminEmail : "Admin@email.com",
        global_activity_deadline : 1,
        global_injection_deadline : 2,
    }]
])


AppState[JSON_TRACER] = new Map([
    [1, {
        id : 1,
        shortname : "test_tracer_1", // inconsistency, Fuck
        clinical_name : "test_clinical_name_1",
        isotope : 1,
        tracer_type : TRACER_TYPE_ACTIVITY,
        default_price_per_unit : null,
        vial_tag : null
    }], [2, {
        id : 2,
        shortname : "test_tracer_2",
        clinical_name : "test_clinical_name_2",
        isotope : 1,
        tracer_type : TRACER_TYPE_DOSE,
        default_price_per_unit : null,
        vial_tag : null
    }], [3, {
        id : 3,
        shortname : "test_tracer_3",
        clinical_name : "test_clinical_name_#",
        isotope : 3,
        tracer_type : TRACER_TYPE_ACTIVITY,
        default_price_per_unit : null,
        vial_tag : null
    }], [4, {
        id : 4,
        shortname : "test_tracer_4",
        clinical_name : "test_clinical_name_4",
        isotope : 3,
        tracer_type : TRACER_TYPE_DOSE,
        default_price_per_unit : null,
        vial_tag : null
    }]
])

AppState[JSON_TRACER_MAPPING] = new Map([
    [1, {
        id : 1,
        customer : 1,
        tracer : 1,
        max_injections : null,
        overhead_multiplier : 1.25
    }], [2, {
        id : 2,
        customer : 1,
        tracer : 2,
        max_injections : null,
        overhead_multiplier : 1
    }], [3, {
        id : 3,
        customer : 1,
        tracer : 3,
        max_injections : null,
        overhead_multiplier : 1.15
    }], [4, {
        id : 4,
        customer : 1,
        tracer : 4,
        max_injections : null,
        overhead_multiplier : 1
    }], [5, {
        id : 5,
        customer : 2,
        tracer : 2,
        max_injections : null,
        overhead_multiplier : 1
    }],


])


AppState[JSON_VIAL] = new Map([
    [1, {
        id : 1,
        tracer : 1,
        activity : 13000,
        volume : 13.37,
        lot_number : "test-200405-1",
        fill_time : "07:54:44",
        fill_date : "2020-05-04",
        assigned_to : null,
        owner : 1,
    }], [2, {
        id : 2,
        tracer : 1,
        activity : 13005,
        volume : 13.37,
        lot_number : "test-200405-1",
        fill_time : "07:54:44",
        fill_date : "2020-05-01",
        assigned_to : null,
        owner : 1,
    }], [3, {
        id : 3,
        tracer : 1,
        activity : 13005,
        volume : 13.37,
        lot_number : "test-200405-1",
        fill_time : "07:54:44",
        fill_date : "2020-04-28",
        assigned_to : null,
        owner : 1,
    }]
])



