/**Automatically generated file by generate JavascriptDataClasses.py */
/**Contains a mapping of the database and their fields. */

export class User {
  constructor(last_login, id, username, password, UserGroup, OldTracerBaseID, ) {
    this.last_login=last_login
    this.id=id
    this.username=username
    this.password=password
    this.UserGroup=UserGroup
    this.OldTracerBaseID=OldTracerBaseID
  }
}

export class SecondaryEmail {
  constructor(secondary_email_id, email, record_user, ) {
    this.secondary_email_id=secondary_email_id
    this.email=email
    this.record_user=record_user
  }
}

export class Isotope {
  constructor(isotope_id, atomic_number, atomic_mass, halflife_seconds, atomic_letter, ) {
    this.isotope_id=isotope_id
    this.atomic_number=atomic_number
    this.atomic_mass=atomic_mass
    this.halflife_seconds=halflife_seconds
    this.atomic_letter=atomic_letter
  }
}

export class Tracer {
  constructor(tracer_id, shortname, clinical_name, isotope, tracer_type, default_price_per_unit, vial_tag, ) {
    this.tracer_id=tracer_id
    this.shortname=shortname
    this.clinical_name=clinical_name
    this.isotope=isotope
    this.tracer_type=tracer_type
    this.default_price_per_unit=default_price_per_unit
    this.vial_tag=vial_tag
  }
}

export class Procedure {
  constructor(procedure_id, series_description, tracer_units, in_use, delay_minutes, tracer, ) {
    this.procedure_id=procedure_id
    this.series_description=series_description
    this.tracer_units=tracer_units
    this.in_use=in_use
    this.delay_minutes=delay_minutes
    this.tracer=tracer
  }
}

export class ActivityProduction {
  constructor(activity_production_id, production_day, tracer, production_time, ) {
    this.activity_production_id=activity_production_id
    this.production_day=production_day
    this.tracer=tracer
    this.production_time=production_time
  }
}

export class ClosedDate {
  constructor(close_date_id, close_date, ) {
    this.close_date_id=close_date_id
    this.close_date=close_date
  }
}

export class Customer {
  constructor(customer_id, short_name, long_name, dispenser_id, billing_address, billing_city, billing_email, billing_phone, billing_zip_code, active_directory_code, ) {
    this.customer_id=customer_id
    this.short_name=short_name
    this.long_name=long_name
    this.dispenser_id=dispenser_id
    this.billing_address=billing_address
    this.billing_city=billing_city
    this.billing_email=billing_email
    this.billing_phone=billing_phone
    this.billing_zip_code=billing_zip_code
    this.active_directory_code=active_directory_code
  }
}

export class TracerCatalog {
  constructor(tracer_catalog_id, customer, tracer, max_injections, overhead_multiplier, ) {
    this.tracer_catalog_id=tracer_catalog_id
    this.customer=customer
    this.tracer=tracer
    this.max_injections=max_injections
    this.overhead_multiplier=overhead_multiplier
  }
}

export class UserAssignment {
  constructor(user_assignment, user_id, customer_id, ) {
    this.user_assignment=user_assignment
    this.user_id=user_id
    this.customer_id=customer_id
  }
}

export class Message {
  constructor(message_id, message, expiration, ) {
    this.message_id=message_id
    this.message=message
    this.expiration=expiration
  }
}

export class MessageAssignment {
  constructor(message_assignment_id, message_id, customer_id, ) {
    this.message_assignment_id=message_assignment_id
    this.message_id=message_id
    this.customer_id=customer_id
  }
}

export class DeliveryEndpoint {
  constructor(tracer_endpoint_id, address, city, zip_code, phone, name, owner, ) {
    this.tracer_endpoint_id=tracer_endpoint_id
    this.address=address
    this.city=city
    this.zip_code=zip_code
    this.phone=phone
    this.name=name
    this.owner=owner
  }
}

export class Location {
  constructor(location_id, location_code, endpoint, common_name, ) {
    this.location_id=location_id
    this.location_code=location_code
    this.endpoint=endpoint
    this.common_name=common_name
  }
}

export class Booking {
  constructor(booking_id, status, location, procedure, accession_number, start_time, start_date, ) {
    this.booking_id=booking_id
    this.status=status
    this.location=location
    this.procedure=procedure
    this.accession_number=accession_number
    this.start_time=start_time
    this.start_date=start_date
  }
}

export class ActivityDeliveryTimeSlot {
  constructor(activity_delivery_time_slot_id, weekly_repeat, delivery_time, destination, production_run, tracer, ) {
    this.activity_delivery_time_slot_id=activity_delivery_time_slot_id
    this.weekly_repeat=weekly_repeat
    this.delivery_time=delivery_time
    this.destination=destination
    this.production_run=production_run
    this.tracer=tracer
  }
}

export class ActivityOrder {
  constructor(activity_order_id, ordered_activity, delivery_date, status, comment, ordered_time_slot, moved_to_time_slot, freed_datetime, ordered_by, freed_by, ) {
    this.activity_order_id=activity_order_id
    this.ordered_activity=ordered_activity
    this.delivery_date=delivery_date
    this.status=status
    this.comment=comment
    this.ordered_time_slot=ordered_time_slot
    this.moved_to_time_slot=moved_to_time_slot
    this.freed_datetime=freed_datetime
    this.ordered_by=ordered_by
    this.freed_by=freed_by
  }
}

export class InjectionOrder {
  constructor(injection_order_id, delivery_time, delivery_date, injections, status, tracer_usage, comment, ordered_by, endpoint, tracer, lot_number, freed_datetime, freed_by, ) {
    this.injection_order_id=injection_order_id
    this.delivery_time=delivery_time
    this.delivery_date=delivery_date
    this.injections=injections
    this.status=status
    this.tracer_usage=tracer_usage
    this.comment=comment
    this.ordered_by=ordered_by
    this.endpoint=endpoint
    this.tracer=tracer
    this.lot_number=lot_number
    this.freed_datetime=freed_datetime
    this.freed_by=freed_by
  }
}

export class Vial {
  constructor(vial_id, tracer, activity, volume, lot_number, fill_time, fill_date, assigned_to, owner, ) {
    this.vial_id=vial_id
    this.tracer=tracer
    this.activity=activity
    this.volume=volume
    this.lot_number=lot_number
    this.fill_time=fill_time
    this.fill_date=fill_date
    this.assigned_to=assigned_to
    this.owner=owner
  }
}

export class LegacyProductionMember {
  constructor(legacy_user_id, legacy_production_username, ) {
    this.legacy_user_id=legacy_user_id
    this.legacy_production_username=legacy_production_username
  }
}

export class LegacyInjectionOrder {
  constructor(legacy_order_id, new_order_id, legacy_freed_id, ) {
    this.legacy_order_id=legacy_order_id
    this.new_order_id=new_order_id
    this.legacy_freed_id=legacy_freed_id
  }
}

export class LegacyActivityOrder {
  constructor(legacy_order_id, new_order_id, legacy_freed_id, legacy_freed_amount, legacy_lot_number, ) {
    this.legacy_order_id=legacy_order_id
    this.new_order_id=new_order_id
    this.legacy_freed_id=legacy_freed_id
    this.legacy_freed_amount=legacy_freed_amount
    this.legacy_lot_number=legacy_lot_number
  }
}

export class Address {
  constructor(ID, ip, port, description, ) {
    this.ID=ID
    this.ip=ip
    this.port=port
    this.description=description
  }
}

export class Database {
  constructor(databaseName, username, password, legacy_database, address, testinDatabase, databaseType, ) {
    this.databaseName=databaseName
    this.username=username
    this.password=password
    this.legacy_database=legacy_database
    this.address=address
    this.testinDatabase=testinDatabase
    this.databaseType=databaseType
  }
}

export class ServerConfiguration {
  constructor(ID, ExternalDatabase, SMTPServer, DateRange, AdminPhoneNumber, AdminEmail, ) {
    this.ID=ID
    this.ExternalDatabase=ExternalDatabase
    this.SMTPServer=SMTPServer
    this.DateRange=DateRange
    this.AdminPhoneNumber=AdminPhoneNumber
    this.AdminEmail=AdminEmail
  }
}

