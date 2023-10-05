/**Automatically generated file by generate JavascriptDataClasses.py */
/**Contains a mapping of the database and their fields. */

export class Address {
  constructor(id, ip, port, description, ) {
    this.id=id
    this.ip=ip
    this.port=port
    this.description=description
  }
}

export class ActivityOrder {
  constructor(id, ordered_activity, delivery_date, status, comment, ordered_time_slot, moved_to_time_slot, freed_datetime, ordered_by, freed_by, ) {
    this.id=id
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

export class Booking {
  constructor(id, status, location, procedure, accession_number, start_time, start_date, ) {
    this.id=id
    this.status=status
    this.location=location
    this.procedure=procedure
    this.accession_number=accession_number
    this.start_time=start_time
    this.start_date=start_date
  }
}

export class ClosedDate {
  constructor(id, close_date, ) {
    this.id=id
    this.close_date=close_date
  }
}

export class Customer {
  constructor(id, short_name, long_name, dispenser_id, billing_address, billing_city, billing_email, billing_phone, billing_zip_code, active_directory_code, ) {
    this.id=id
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

export class Deadline {
  constructor(id, deadline_type, deadline_time, deadline_day, ) {
    this.id=id
    this.deadline_type=deadline_type
    this.deadline_time=deadline_time
    this.deadline_day=deadline_day
  }
}

export class ActivityDeliveryTimeSlot {
  constructor(id, weekly_repeat, delivery_time, destination, production_run, expiration_date, ) {
    this.id=id
    this.weekly_repeat=weekly_repeat
    this.delivery_time=delivery_time
    this.destination=destination
    this.production_run=production_run
    this.expiration_date=expiration_date
  }
}

export class DicomEndpoint {
  constructor(id, address, ae_title, ) {
    this.id=id
    this.address=address
    this.ae_title=ae_title
  }
}

export class DeliveryEndpoint {
  constructor(id, address, city, zip_code, phone, name, owner, ) {
    this.id=id
    this.address=address
    this.city=city
    this.zip_code=zip_code
    this.phone=phone
    this.name=name
    this.owner=owner
  }
}

export class InjectionOrder {
  constructor(id, delivery_time, delivery_date, injections, status, tracer_usage, comment, ordered_by, endpoint, tracer, lot_number, freed_datetime, freed_by, ) {
    this.id=id
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

export class Isotope {
  constructor(id, atomic_number, atomic_mass, halflife_seconds, atomic_letter, metastable, ) {
    this.id=id
    this.atomic_number=atomic_number
    this.atomic_mass=atomic_mass
    this.halflife_seconds=halflife_seconds
    this.atomic_letter=atomic_letter
    this.metastable=metastable
  }
}

export class ReleaseRight {
  constructor(id, expiry_date, releaser, product, ) {
    this.id=id
    this.expiry_date=expiry_date
    this.releaser=releaser
    this.product=product
  }
}

export class LegacyProductionMember {
  constructor(id, legacy_production_username, ) {
    this.id=id
    this.legacy_production_username=legacy_production_username
  }
}

export class Location {
  constructor(id, location_code, endpoint, common_name, ) {
    this.id=id
    this.location_code=location_code
    this.endpoint=endpoint
    this.common_name=common_name
  }
}

export class Message {
  constructor(id, message, expiration, ) {
    this.id=id
    this.message=message
    this.expiration=expiration
  }
}

export class MessageAssignment {
  constructor(id, message_id, customer_id, ) {
    this.id=id
    this.message_id=message_id
    this.customer_id=customer_id
  }
}

export class Tracer {
  constructor(id, shortname, clinical_name, isotope, tracer_type, default_price_per_unit, vial_tag, archived, ) {
    this.id=id
    this.shortname=shortname
    this.clinical_name=clinical_name
    this.isotope=isotope
    this.tracer_type=tracer_type
    this.default_price_per_unit=default_price_per_unit
    this.vial_tag=vial_tag
    this.archived=archived
  }
}

export class TracerCatalogPage {
  constructor(id, customer, tracer, max_injections, overhead_multiplier, ) {
    this.id=id
    this.customer=customer
    this.tracer=tracer
    this.max_injections=max_injections
    this.overhead_multiplier=overhead_multiplier
  }
}

export class Procedure {
  constructor(id, series_description, tracer_units, delay_minutes, tracer, owner, ) {
    this.id=id
    this.series_description=series_description
    this.tracer_units=tracer_units
    this.delay_minutes=delay_minutes
    this.tracer=tracer
    this.owner=owner
  }
}

export class ProcedureIdentifier {
  constructor(id, string, ) {
    this.id=id
    this.string=string
  }
}

export class ActivityProduction {
  constructor(id, production_day, tracer, production_time, expiration_date, ) {
    this.id=id
    this.production_day=production_day
    this.tracer=tracer
    this.production_time=production_time
    this.expiration_date=expiration_date
  }
}

export class SecondaryEmail {
  constructor(id, email, record_user, ) {
    this.id=id
    this.email=email
    this.record_user=record_user
  }
}

export class ServerConfiguration {
  constructor(id, SMTPServer, DateRange, AdminPhoneNumber, AdminEmail, global_activity_deadline, global_injection_deadline, ping_service_ae_tile, ris_dicom_endpoint, ) {
    this.id=id
    this.SMTPServer=SMTPServer
    this.DateRange=DateRange
    this.AdminPhoneNumber=AdminPhoneNumber
    this.AdminEmail=AdminEmail
    this.global_activity_deadline=global_activity_deadline
    this.global_injection_deadline=global_injection_deadline
    this.ping_service_ae_tile=ping_service_ae_tile
    this.ris_dicom_endpoint=ris_dicom_endpoint
  }
}

export class User {
  constructor(last_login, id, username, user_group, active, ) {
    this.last_login=last_login
    this.id=id
    this.username=username
    this.user_group=user_group
    this.active=active
  }
}

export class UserAssignment {
  constructor(id, user, customer, ) {
    this.id=id
    this.user=user
    this.customer=customer
  }
}

export class Vial {
  constructor(id, tracer, activity, volume, lot_number, fill_time, fill_date, assigned_to, owner, ) {
    this.id=id
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

export const MODELS = {
  address : Address,
  orders : ActivityOrder,
  booking : Booking,
  closeddate : ClosedDate,
  customer : Customer,
  deadline : Deadline,
  deliverTimes : ActivityDeliveryTimeSlot,
  dicom_endpoint : DicomEndpoint,
  deliveryEndpoint : DeliveryEndpoint,
  t_orders : InjectionOrder,
  isotopes : Isotope,
  release_right : ReleaseRight,
  legacy_production_member : LegacyProductionMember,
  location : Location,
  message : Message,
  messageAssignment : MessageAssignment,
  tracer : Tracer,
  tracer_mapping : TracerCatalogPage,
  procedure : Procedure,
  procedure_identifier : ProcedureIdentifier,
  production : ActivityProduction,
  secondaryEmail : SecondaryEmail,
  server_config : ServerConfiguration,
  user : User,
  userAssignment : UserAssignment,
  vial : Vial,
}

