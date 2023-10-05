/**Automatically generated file by generate JavascriptDataClasses.py */
/**Contains all keywords used by database */

// Model: Address
export const KEYWORD_Address_ID = "id";
export const KEYWORD_Address_IP = "ip";
export const KEYWORD_Address_PORT = "port";
export const KEYWORD_Address_DESCRIPTION = "description";

// Model: ActivityOrder
export const KEYWORD_ActivityOrder_ID = "id";
export const KEYWORD_ActivityOrder_ORDERED_ACTIVITY = "ordered_activity";
export const KEYWORD_ActivityOrder_DELIVERY_DATE = "delivery_date";
export const KEYWORD_ActivityOrder_STATUS = "status";
export const KEYWORD_ActivityOrder_COMMENT = "comment";
export const KEYWORD_ActivityOrder_ORDERED_TIME_SLOT = "ordered_time_slot";
export const KEYWORD_ActivityOrder_MOVED_TO_TIME_SLOT = "moved_to_time_slot";
export const KEYWORD_ActivityOrder_FREED_DATETIME = "freed_datetime";
export const KEYWORD_ActivityOrder_ORDERED_BY = "ordered_by";
export const KEYWORD_ActivityOrder_FREED_BY = "freed_by";

// Model: Booking
export const KEYWORD_Booking_ID = "id";
export const KEYWORD_Booking_STATUS = "status";
export const KEYWORD_Booking_LOCATION = "location";
export const KEYWORD_Booking_PROCEDURE = "procedure";
export const KEYWORD_Booking_ACCESSION_NUMBER = "accession_number";
export const KEYWORD_Booking_START_TIME = "start_time";
export const KEYWORD_Booking_START_DATE = "start_date";

// Model: ClosedDate
export const KEYWORD_ClosedDate_ID = "id";
export const KEYWORD_ClosedDate_CLOSE_DATE = "close_date";

// Model: Customer
export const KEYWORD_Customer_ID = "id";
export const KEYWORD_Customer_SHORT_NAME = "short_name";
export const KEYWORD_Customer_LONG_NAME = "long_name";
export const KEYWORD_Customer_DISPENSER_ID = "dispenser_id";
export const KEYWORD_Customer_BILLING_ADDRESS = "billing_address";
export const KEYWORD_Customer_BILLING_CITY = "billing_city";
export const KEYWORD_Customer_BILLING_EMAIL = "billing_email";
export const KEYWORD_Customer_BILLING_PHONE = "billing_phone";
export const KEYWORD_Customer_BILLING_ZIP_CODE = "billing_zip_code";
export const KEYWORD_Customer_ACTIVE_DIRECTORY_CODE = "active_directory_code";

// Model: Deadline
export const KEYWORD_Deadline_ID = "id";
export const KEYWORD_Deadline_DEADLINE_TYPE = "deadline_type";
export const KEYWORD_Deadline_DEADLINE_TIME = "deadline_time";
export const KEYWORD_Deadline_DEADLINE_DAY = "deadline_day";

// Model: ActivityDeliveryTimeSlot
export const KEYWORD_ActivityDeliveryTimeSlot_ID = "id";
export const KEYWORD_ActivityDeliveryTimeSlot_WEEKLY_REPEAT = "weekly_repeat";
export const KEYWORD_ActivityDeliveryTimeSlot_DELIVERY_TIME = "delivery_time";
export const KEYWORD_ActivityDeliveryTimeSlot_DESTINATION = "destination";
export const KEYWORD_ActivityDeliveryTimeSlot_PRODUCTION_RUN = "production_run";
export const KEYWORD_ActivityDeliveryTimeSlot_EXPIRATION_DATE = "expiration_date";

// Model: DicomEndpoint
export const KEYWORD_DicomEndpoint_ID = "id";
export const KEYWORD_DicomEndpoint_ADDRESS = "address";
export const KEYWORD_DicomEndpoint_AE_TITLE = "ae_title";

// Model: DeliveryEndpoint
export const KEYWORD_DeliveryEndpoint_ID = "id";
export const KEYWORD_DeliveryEndpoint_ADDRESS = "address";
export const KEYWORD_DeliveryEndpoint_CITY = "city";
export const KEYWORD_DeliveryEndpoint_ZIP_CODE = "zip_code";
export const KEYWORD_DeliveryEndpoint_PHONE = "phone";
export const KEYWORD_DeliveryEndpoint_NAME = "name";
export const KEYWORD_DeliveryEndpoint_OWNER = "owner";

// Model: InjectionOrder
export const KEYWORD_InjectionOrder_ID = "id";
export const KEYWORD_InjectionOrder_DELIVERY_TIME = "delivery_time";
export const KEYWORD_InjectionOrder_DELIVERY_DATE = "delivery_date";
export const KEYWORD_InjectionOrder_INJECTIONS = "injections";
export const KEYWORD_InjectionOrder_STATUS = "status";
export const KEYWORD_InjectionOrder_TRACER_USAGE = "tracer_usage";
export const KEYWORD_InjectionOrder_COMMENT = "comment";
export const KEYWORD_InjectionOrder_ORDERED_BY = "ordered_by";
export const KEYWORD_InjectionOrder_ENDPOINT = "endpoint";
export const KEYWORD_InjectionOrder_TRACER = "tracer";
export const KEYWORD_InjectionOrder_LOT_NUMBER = "lot_number";
export const KEYWORD_InjectionOrder_FREED_DATETIME = "freed_datetime";
export const KEYWORD_InjectionOrder_FREED_BY = "freed_by";

// Model: Isotope
export const KEYWORD_Isotope_ID = "id";
export const KEYWORD_Isotope_ATOMIC_NUMBER = "atomic_number";
export const KEYWORD_Isotope_ATOMIC_MASS = "atomic_mass";
export const KEYWORD_Isotope_HALFLIFE_SECONDS = "halflife_seconds";
export const KEYWORD_Isotope_ATOMIC_LETTER = "atomic_letter";
export const KEYWORD_Isotope_METASTABLE = "metastable";

// Model: ReleaseRight
export const KEYWORD_ReleaseRight_ID = "id";
export const KEYWORD_ReleaseRight_EXPIRY_DATE = "expiry_date";
export const KEYWORD_ReleaseRight_RELEASER = "releaser";
export const KEYWORD_ReleaseRight_PRODUCT = "product";

// Model: LegacyProductionMember
export const KEYWORD_LegacyProductionMember_ID = "id";
export const KEYWORD_LegacyProductionMember_LEGACY_PRODUCTION_USERNAME = "legacy_production_username";

// Model: Location
export const KEYWORD_Location_ID = "id";
export const KEYWORD_Location_LOCATION_CODE = "location_code";
export const KEYWORD_Location_ENDPOINT = "endpoint";
export const KEYWORD_Location_COMMON_NAME = "common_name";

// Model: Message
export const KEYWORD_Message_ID = "id";
export const KEYWORD_Message_MESSAGE = "message";
export const KEYWORD_Message_EXPIRATION = "expiration";

// Model: MessageAssignment
export const KEYWORD_MessageAssignment_ID = "id";
export const KEYWORD_MessageAssignment_MESSAGE_ID = "message_id";
export const KEYWORD_MessageAssignment_CUSTOMER_ID = "customer_id";

// Model: Tracer
export const KEYWORD_Tracer_ID = "id";
export const KEYWORD_Tracer_SHORTNAME = "shortname";
export const KEYWORD_Tracer_CLINICAL_NAME = "clinical_name";
export const KEYWORD_Tracer_ISOTOPE = "isotope";
export const KEYWORD_Tracer_TRACER_TYPE = "tracer_type";
export const KEYWORD_Tracer_DEFAULT_PRICE_PER_UNIT = "default_price_per_unit";
export const KEYWORD_Tracer_VIAL_TAG = "vial_tag";
export const KEYWORD_Tracer_ARCHIVED = "archived";

// Model: TracerCatalogPage
export const KEYWORD_TracerCatalogPage_ID = "id";
export const KEYWORD_TracerCatalogPage_CUSTOMER = "customer";
export const KEYWORD_TracerCatalogPage_TRACER = "tracer";
export const KEYWORD_TracerCatalogPage_MAX_INJECTIONS = "max_injections";
export const KEYWORD_TracerCatalogPage_OVERHEAD_MULTIPLIER = "overhead_multiplier";

// Model: Procedure
export const KEYWORD_Procedure_ID = "id";
export const KEYWORD_Procedure_SERIES_DESCRIPTION = "series_description";
export const KEYWORD_Procedure_TRACER_UNITS = "tracer_units";
export const KEYWORD_Procedure_DELAY_MINUTES = "delay_minutes";
export const KEYWORD_Procedure_TRACER = "tracer";
export const KEYWORD_Procedure_OWNER = "owner";

// Model: ProcedureIdentifier
export const KEYWORD_ProcedureIdentifier_ID = "id";
export const KEYWORD_ProcedureIdentifier_STRING = "string";

// Model: ActivityProduction
export const KEYWORD_ActivityProduction_ID = "id";
export const KEYWORD_ActivityProduction_PRODUCTION_DAY = "production_day";
export const KEYWORD_ActivityProduction_TRACER = "tracer";
export const KEYWORD_ActivityProduction_PRODUCTION_TIME = "production_time";
export const KEYWORD_ActivityProduction_EXPIRATION_DATE = "expiration_date";

// Model: SecondaryEmail
export const KEYWORD_SecondaryEmail_ID = "id";
export const KEYWORD_SecondaryEmail_EMAIL = "email";
export const KEYWORD_SecondaryEmail_RECORD_USER = "record_user";

// Model: ServerConfiguration
export const KEYWORD_ServerConfiguration_ID = "id";
export const KEYWORD_ServerConfiguration_SMTPSERVER = "SMTPServer";
export const KEYWORD_ServerConfiguration_DATERANGE = "DateRange";
export const KEYWORD_ServerConfiguration_ADMINPHONENUMBER = "AdminPhoneNumber";
export const KEYWORD_ServerConfiguration_ADMINEMAIL = "AdminEmail";
export const KEYWORD_ServerConfiguration_GLOBAL_ACTIVITY_DEADLINE = "global_activity_deadline";
export const KEYWORD_ServerConfiguration_GLOBAL_INJECTION_DEADLINE = "global_injection_deadline";
export const KEYWORD_ServerConfiguration_PING_SERVICE_AE_TILE = "ping_service_ae_tile";
export const KEYWORD_ServerConfiguration_RIS_DICOM_ENDPOINT = "ris_dicom_endpoint";

// Model: User
export const KEYWORD_User_LAST_LOGIN = "last_login";
export const KEYWORD_User_ID = "id";
export const KEYWORD_User_USERNAME = "username";
export const KEYWORD_User_PASSWORD = "password";
export const KEYWORD_User_USER_GROUP = "user_group";
export const KEYWORD_User_ACTIVE = "active";

// Model: UserAssignment
export const KEYWORD_UserAssignment_ID = "id";
export const KEYWORD_UserAssignment_USER = "user";
export const KEYWORD_UserAssignment_CUSTOMER = "customer";

// Model: Vial
export const KEYWORD_Vial_ID = "id";
export const KEYWORD_Vial_TRACER = "tracer";
export const KEYWORD_Vial_ACTIVITY = "activity";
export const KEYWORD_Vial_VOLUME = "volume";
export const KEYWORD_Vial_LOT_NUMBER = "lot_number";
export const KEYWORD_Vial_FILL_TIME = "fill_time";
export const KEYWORD_Vial_FILL_DATE = "fill_date";
export const KEYWORD_Vial_ASSIGNED_TO = "assigned_to";
export const KEYWORD_Vial_OWNER = "owner";

