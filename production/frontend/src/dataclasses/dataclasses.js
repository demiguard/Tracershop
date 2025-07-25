/**Automatically generated file by generate JavascriptDataClasses.py */
/**Contains a mapping of the database and their fields. */

import { BooleanField, CharField, DateField, DateTimeField, IntField, FloatField, ForeignField } from '~/lib/database_fields.js'

export class Address {
  constructor(id, ip, port, description, ) {
    this.id=id
    this.ip=ip
    this.port=port
    this.description=description
  }

  /**Copies the address
  * @returns { Address }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.ip,
      this.port,
      this.description
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("ip"),
      new CharField("port"),
      new CharField("description"),
    ];
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

  /**Copies the activityorder
  * @returns { ActivityOrder }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.ordered_activity,
      this.delivery_date,
      this.status,
      this.comment,
      this.ordered_time_slot,
      this.moved_to_time_slot,
      this.freed_datetime,
      this.ordered_by,
      this.freed_by
    )
  }
  fields(){
    return [
      new IntField("id"),
      new FloatField("ordered_activity"),
      new DateField("delivery_date"),
      new IntField("status"),
      new CharField("comment"),
      new ForeignField("ordered_time_slot","deliver_times"),
      new ForeignField("moved_to_time_slot","deliver_times"),
      new DateTimeField("freed_datetime"),
      new ForeignField("ordered_by","user"),
      new ForeignField("freed_by","user"),
    ];
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

  /**Copies the booking
  * @returns { Booking }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.status,
      this.location,
      this.procedure,
      this.accession_number,
      this.start_time,
      this.start_date
    )
  }
  fields(){
    return [
      new IntField("id"),
      new IntField("status"),
      new ForeignField("location","location"),
      new ForeignField("procedure","procedure_identifier"),
      new CharField("accession_number"),
      new DateField("start_time"),
      new DateField("start_date"),
    ];
  }
}

export class ClosedDate {
  constructor(id, close_date, ) {
    this.id=id
    this.close_date=close_date
  }

  /**Copies the closeddate
  * @returns { ClosedDate }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.close_date
    )
  }
  fields(){
    return [
      new IntField("id"),
      new DateField("close_date"),
    ];
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

  /**Copies the customer
  * @returns { Customer }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.short_name,
      this.long_name,
      this.dispenser_id,
      this.billing_address,
      this.billing_city,
      this.billing_email,
      this.billing_phone,
      this.billing_zip_code,
      this.active_directory_code
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("short_name"),
      new CharField("long_name"),
      new IntField("dispenser_id"),
      new CharField("billing_address"),
      new CharField("billing_city"),
      new CharField("billing_email"),
      new CharField("billing_phone"),
      new CharField("billing_zip_code"),
      new CharField("active_directory_code"),
    ];
  }
}

export class Deadline {
  constructor(id, deadline_type, deadline_time, deadline_day, ) {
    this.id=id
    this.deadline_type=deadline_type
    this.deadline_time=deadline_time
    this.deadline_day=deadline_day
  }

  /**Copies the deadline
  * @returns { Deadline }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.deadline_type,
      this.deadline_time,
      this.deadline_day
    )
  }
  fields(){
    return [
      new IntField("id"),
      new IntField("deadline_type"),
      new DateField("deadline_time"),
      new IntField("deadline_day"),
    ];
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

  /**Copies the activitydeliverytimeslot
  * @returns { ActivityDeliveryTimeSlot }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.weekly_repeat,
      this.delivery_time,
      this.destination,
      this.production_run,
      this.expiration_date
    )
  }
  fields(){
    return [
      new IntField("id"),
      new IntField("weekly_repeat"),
      new DateField("delivery_time"),
      new ForeignField("destination","delivery_endpoint"),
      new ForeignField("production_run","production"),
      new DateField("expiration_date"),
    ];
  }
}

export class DicomEndpoint {
  constructor(id, address, ae_title, ) {
    this.id=id
    this.address=address
    this.ae_title=ae_title
  }

  /**Copies the dicomendpoint
  * @returns { DicomEndpoint }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.address,
      this.ae_title
    )
  }
  fields(){
    return [
      new IntField("id"),
      new ForeignField("address","address"),
      new CharField("ae_title"),
    ];
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

  /**Copies the deliveryendpoint
  * @returns { DeliveryEndpoint }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.address,
      this.city,
      this.zip_code,
      this.phone,
      this.name,
      this.owner
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("address"),
      new CharField("city"),
      new CharField("zip_code"),
      new CharField("phone"),
      new CharField("name"),
      new ForeignField("owner","customer"),
    ];
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

  /**Copies the injectionorder
  * @returns { InjectionOrder }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.delivery_time,
      this.delivery_date,
      this.injections,
      this.status,
      this.tracer_usage,
      this.comment,
      this.ordered_by,
      this.endpoint,
      this.tracer,
      this.lot_number,
      this.freed_datetime,
      this.freed_by
    )
  }
  fields(){
    return [
      new IntField("id"),
      new DateField("delivery_time"),
      new DateField("delivery_date"),
      new IntField("injections"),
      new IntField("status"),
      new IntField("tracer_usage"),
      new CharField("comment"),
      new ForeignField("ordered_by","user"),
      new ForeignField("endpoint","delivery_endpoint"),
      new ForeignField("tracer","tracer"),
      new CharField("lot_number"),
      new DateTimeField("freed_datetime"),
      new ForeignField("freed_by","user"),
    ];
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

  /**Copies the isotope
  * @returns { Isotope }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.atomic_number,
      this.atomic_mass,
      this.halflife_seconds,
      this.atomic_letter,
      this.metastable
    )
  }
  fields(){
    return [
      new IntField("id"),
      new IntField("atomic_number"),
      new IntField("atomic_mass"),
      new FloatField("halflife_seconds"),
      new CharField("atomic_letter"),
      new BooleanField("metastable"),
    ];
  }
}

export class IsotopeDelivery {
  constructor(id, production, weekly_repeat, delivery_endpoint, delivery_time, ) {
    this.id=id
    this.production=production
    this.weekly_repeat=weekly_repeat
    this.delivery_endpoint=delivery_endpoint
    this.delivery_time=delivery_time
  }

  /**Copies the isotopedelivery
  * @returns { IsotopeDelivery }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.production,
      this.weekly_repeat,
      this.delivery_endpoint,
      this.delivery_time
    )
  }
  fields(){
    return [
      new IntField("id"),
      new ForeignField("production","isotope_production"),
      new IntField("weekly_repeat"),
      new ForeignField("delivery_endpoint","delivery_endpoint"),
      new DateField("delivery_time"),
    ];
  }
}

export class IsotopeOrder {
  constructor(id, status, order_by, ordered_activity_MBq, destination, delivery_date, comment, freed_by, freed_datetime, ) {
    this.id=id
    this.status=status
    this.order_by=order_by
    this.ordered_activity_MBq=ordered_activity_MBq
    this.destination=destination
    this.delivery_date=delivery_date
    this.comment=comment
    this.freed_by=freed_by
    this.freed_datetime=freed_datetime
  }

  /**Copies the isotopeorder
  * @returns { IsotopeOrder }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.status,
      this.order_by,
      this.ordered_activity_MBq,
      this.destination,
      this.delivery_date,
      this.comment,
      this.freed_by,
      this.freed_datetime
    )
  }
  fields(){
    return [
      new IntField("id"),
      new IntField("status"),
      new ForeignField("order_by","user"),
      new FloatField("ordered_activity_MBq"),
      new ForeignField("destination","isotope_delivery"),
      new DateField("delivery_date"),
      new CharField("comment"),
      new ForeignField("freed_by","user"),
      new DateTimeField("freed_datetime"),
    ];
  }
}

export class IsotopeProduction {
  constructor(id, isotope, production_day, production_time, expiry_time, ) {
    this.id=id
    this.isotope=isotope
    this.production_day=production_day
    this.production_time=production_time
    this.expiry_time=expiry_time
  }

  /**Copies the isotopeproduction
  * @returns { IsotopeProduction }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.isotope,
      this.production_day,
      this.production_time,
      this.expiry_time
    )
  }
  fields(){
    return [
      new IntField("id"),
      new ForeignField("isotope","isotopes"),
      new IntField("production_day"),
      new DateField("production_time"),
      new DateField("expiry_time"),
    ];
  }
}

export class IsotopeVial {
  constructor(id, batch_nr, delivery_with, volume, calibration_datetime, vial_activity, isotope, ) {
    this.id=id
    this.batch_nr=batch_nr
    this.delivery_with=delivery_with
    this.volume=volume
    this.calibration_datetime=calibration_datetime
    this.vial_activity=vial_activity
    this.isotope=isotope
  }

  /**Copies the isotopevial
  * @returns { IsotopeVial }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.batch_nr,
      this.delivery_with,
      this.volume,
      this.calibration_datetime,
      this.vial_activity,
      this.isotope
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("batch_nr"),
      new ForeignField("delivery_with","isotope_order"),
      new FloatField("volume"),
      new DateTimeField("calibration_datetime"),
      new FloatField("vial_activity"),
      new ForeignField("isotope","isotopes"),
    ];
  }
}

export class ReleaseRight {
  constructor(id, expiry_date, releaser, product, ) {
    this.id=id
    this.expiry_date=expiry_date
    this.releaser=releaser
    this.product=product
  }

  /**Copies the releaseright
  * @returns { ReleaseRight }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.expiry_date,
      this.releaser,
      this.product
    )
  }
  fields(){
    return [
      new IntField("id"),
      new DateField("expiry_date"),
      new ForeignField("releaser","user"),
      new ForeignField("product","tracer"),
    ];
  }
}

export class LegacyProductionMember {
  constructor(id, legacy_production_username, ) {
    this.id=id
    this.legacy_production_username=legacy_production_username
  }

  /**Copies the legacyproductionmember
  * @returns { LegacyProductionMember }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.legacy_production_username
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("legacy_production_username"),
    ];
  }
}

export class Location {
  constructor(id, location_code, endpoint, common_name, ) {
    this.id=id
    this.location_code=location_code
    this.endpoint=endpoint
    this.common_name=common_name
  }

  /**Copies the location
  * @returns { Location }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.location_code,
      this.endpoint,
      this.common_name
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("location_code"),
      new ForeignField("endpoint","delivery_endpoint"),
      new CharField("common_name"),
    ];
  }
}

export class Message {
  constructor(id, message, expiration, ) {
    this.id=id
    this.message=message
    this.expiration=expiration
  }

  /**Copies the message
  * @returns { Message }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.message,
      this.expiration
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("message"),
      new DateField("expiration"),
    ];
  }
}

export class MessageAssignment {
  constructor(id, message_id, customer_id, ) {
    this.id=id
    this.message_id=message_id
    this.customer_id=customer_id
  }

  /**Copies the messageassignment
  * @returns { MessageAssignment }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.message_id,
      this.customer_id
    )
  }
  fields(){
    return [
      new IntField("id"),
      new ForeignField("message_id","message"),
      new ForeignField("customer_id","customer"),
    ];
  }
}

export class TelemetryRecord {
  constructor(id, request_type, created, latency_ms, status, expire_datetime, ) {
    this.id=id
    this.request_type=request_type
    this.created=created
    this.latency_ms=latency_ms
    this.status=status
    this.expire_datetime=expire_datetime
  }

  /**Copies the telemetryrecord
  * @returns { TelemetryRecord }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.request_type,
      this.created,
      this.latency_ms,
      this.status,
      this.expire_datetime
    )
  }
  fields(){
    return [
      new IntField("id"),
      new ForeignField("request_type","telemetry_request"),
      new DateTimeField("created"),
      new FloatField("latency_ms"),
      new IntField("status"),
    ];
  }
}

export class TelemetryRequest {
  constructor(id, message_key, display_name, ) {
    this.id=id
    this.message_key=message_key
    this.display_name=display_name
  }

  /**Copies the telemetryrequest
  * @returns { TelemetryRequest }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.message_key,
      this.display_name
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("message_key"),
      new CharField("display_name"),
    ];
  }
}

export class Tracer {
  constructor(id, shortname, clinical_name, isotope, tracer_type, vial_tag, archived, marketed, is_static_instance, ) {
    this.id=id
    this.shortname=shortname
    this.clinical_name=clinical_name
    this.isotope=isotope
    this.tracer_type=tracer_type
    this.vial_tag=vial_tag
    this.archived=archived
    this.marketed=marketed
    this.is_static_instance=is_static_instance
  }

  /**Copies the tracer
  * @returns { Tracer }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.shortname,
      this.clinical_name,
      this.isotope,
      this.tracer_type,
      this.vial_tag,
      this.archived,
      this.marketed,
      this.is_static_instance
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("shortname"),
      new CharField("clinical_name"),
      new ForeignField("isotope","isotopes"),
      new IntField("tracer_type"),
      new CharField("vial_tag"),
      new BooleanField("archived"),
      new BooleanField("marketed"),
    ];
  }
}

export class TracerCatalogPage {
  constructor(id, endpoint, tracer, max_injections, overhead_multiplier, ) {
    this.id=id
    this.endpoint=endpoint
    this.tracer=tracer
    this.max_injections=max_injections
    this.overhead_multiplier=overhead_multiplier
  }

  /**Copies the tracercatalogpage
  * @returns { TracerCatalogPage }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.endpoint,
      this.tracer,
      this.max_injections,
      this.overhead_multiplier
    )
  }
  fields(){
    return [
      new IntField("id"),
      new ForeignField("endpoint","delivery_endpoint"),
      new ForeignField("tracer","tracer"),
      new IntField("max_injections"),
      new FloatField("overhead_multiplier"),
    ];
  }
}

export class Printer {
  constructor(id, name, ip, port, label_printer, ) {
    this.id=id
    this.name=name
    this.ip=ip
    this.port=port
    this.label_printer=label_printer
  }

  /**Copies the printer
  * @returns { Printer }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.name,
      this.ip,
      this.port,
      this.label_printer
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("name"),
      new IPField("ip"),
      new IntField("port"),
      new BooleanField("label_printer"),
    ];
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

  /**Copies the procedure
  * @returns { Procedure }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.series_description,
      this.tracer_units,
      this.delay_minutes,
      this.tracer,
      this.owner
    )
  }
  fields(){
    return [
      new IntField("id"),
      new ForeignField("series_description","procedure_identifier"),
      new FloatField("tracer_units"),
      new FloatField("delay_minutes"),
      new ForeignField("tracer","tracer"),
      new ForeignField("owner","delivery_endpoint"),
    ];
  }
}

export class ProcedureIdentifier {
  constructor(id, code, description, is_pet, ) {
    this.id=id
    this.code=code
    this.description=description
    this.is_pet=is_pet
  }

  /**Copies the procedureidentifier
  * @returns { ProcedureIdentifier }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.code,
      this.description,
      this.is_pet
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("code"),
      new CharField("description"),
      new BooleanField("is_pet"),
    ];
  }
}

export class ActivityProduction {
  constructor(id, production_day, tracer, production_time, is_static_instance, ) {
    this.id=id
    this.production_day=production_day
    this.tracer=tracer
    this.production_time=production_time
    this.is_static_instance=is_static_instance
  }

  /**Copies the activityproduction
  * @returns { ActivityProduction }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.production_day,
      this.tracer,
      this.production_time,
      this.is_static_instance
    )
  }
  fields(){
    return [
      new IntField("id"),
      new IntField("production_day"),
      new ForeignField("tracer","tracer"),
      new DateField("production_time"),
    ];
  }
}

export class SecondaryEmail {
  constructor(id, email, record_user, ) {
    this.id=id
    this.email=email
    this.record_user=record_user
  }

  /**Copies the secondaryemail
  * @returns { SecondaryEmail }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.email,
      this.record_user
    )
  }
  fields(){
    return [
      new IntField("id"),
      new CharField("email"),
      new ForeignField("record_user","user"),
    ];
  }
}

export class ServerConfiguration {
  constructor(id, SMTPServer, DateRange, AdminPhoneNumber, AdminEmail, global_activity_deadline, global_injection_deadline, ping_service_ae_tile, ris_dicom_endpoint, record_telemetry, active_label_printer, active_printer, weekly_close_days, ) {
    this.id=id
    this.SMTPServer=SMTPServer
    this.DateRange=DateRange
    this.AdminPhoneNumber=AdminPhoneNumber
    this.AdminEmail=AdminEmail
    this.global_activity_deadline=global_activity_deadline
    this.global_injection_deadline=global_injection_deadline
    this.ping_service_ae_tile=ping_service_ae_tile
    this.ris_dicom_endpoint=ris_dicom_endpoint
    this.record_telemetry=record_telemetry
    this.active_label_printer=active_label_printer
    this.active_printer=active_printer
    this.weekly_close_days=weekly_close_days
  }

  /**Copies the serverconfiguration
  * @returns { ServerConfiguration }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.SMTPServer,
      this.DateRange,
      this.AdminPhoneNumber,
      this.AdminEmail,
      this.global_activity_deadline,
      this.global_injection_deadline,
      this.ping_service_ae_tile,
      this.ris_dicom_endpoint,
      this.record_telemetry,
      this.active_label_printer,
      this.active_printer,
      this.weekly_close_days
    )
  }
  fields(){
    return [
      new IntField("id"),
      new IPField("SMTPServer"),
      new IntField("DateRange"),
      new CharField("AdminPhoneNumber"),
      new CharField("AdminEmail"),
      new ForeignField("global_activity_deadline","deadline"),
      new ForeignField("global_injection_deadline","deadline"),
      new CharField("ping_service_ae_tile"),
      new ForeignField("ris_dicom_endpoint","dicom_endpoint"),
      new BooleanField("record_telemetry"),
      new ForeignField("active_label_printer","printer"),
      new ForeignField("active_printer","printer"),
      new IntField("weekly_close_days"),
    ];
  }
}

export class ServerLog {
  constructor(id, created, message, level, ) {
    this.id=id
    this.created=created
    this.message=message
    this.level=level
  }

  /**Copies the serverlog
  * @returns { ServerLog }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.created,
      this.message,
      this.level
    )
  }
  fields(){
    return [
      new IntField("id"),
      new DateTimeField("created"),
      new CharField("message"),
      new IntField("level"),
    ];
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

  /**Copies the user
  * @returns { User }
   */
  copy(){
    return new this.constructor(
      this.last_login,
      this.id,
      this.username,
      this.user_group,
      this.active
    )
  }
  fields(){
    return [
      new DateTimeField("last_login"),
      new IntField("id"),
      new CharField("username"),
      new IntField("user_group"),
      new BooleanField("active"),
    ];
  }
}

export class UserAssignment {
  constructor(id, user, customer, ) {
    this.id=id
    this.user=user
    this.customer=customer
  }

  /**Copies the userassignment
  * @returns { UserAssignment }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.user,
      this.customer
    )
  }
  fields(){
    return [
      new IntField("id"),
      new ForeignField("user","user"),
      new ForeignField("customer","customer"),
    ];
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

  /**Copies the vial
  * @returns { Vial }
   */
  copy(){
    return new this.constructor(
      this.id,
      this.tracer,
      this.activity,
      this.volume,
      this.lot_number,
      this.fill_time,
      this.fill_date,
      this.assigned_to,
      this.owner
    )
  }
  fields(){
    return [
      new IntField("id"),
      new ForeignField("tracer","tracer"),
      new FloatField("activity"),
      new FloatField("volume"),
      new CharField("lot_number"),
      new DateField("fill_time"),
      new DateField("fill_date"),
      new ForeignField("assigned_to","activity_orders"),
      new ForeignField("owner","customer"),
    ];
  }
}

export const MODELS = {
  address : Address,
  activity_orders : ActivityOrder,
  booking : Booking,
  closed_date : ClosedDate,
  customer : Customer,
  deadline : Deadline,
  deliver_times : ActivityDeliveryTimeSlot,
  dicom_endpoint : DicomEndpoint,
  delivery_endpoint : DeliveryEndpoint,
  injection_orders : InjectionOrder,
  isotopes : Isotope,
  isotope_delivery : IsotopeDelivery,
  isotope_order : IsotopeOrder,
  isotope_production : IsotopeProduction,
  isotope_vial : IsotopeVial,
  release_right : ReleaseRight,
  legacy_production_member : LegacyProductionMember,
  location : Location,
  message : Message,
  message_assignment : MessageAssignment,
  telemetry_record : TelemetryRecord,
  telemetry_request : TelemetryRequest,
  tracer : Tracer,
  tracer_mapping : TracerCatalogPage,
  printer : Printer,
  procedure : Procedure,
  procedure_identifier : ProcedureIdentifier,
  production : ActivityProduction,
  secondary_email : SecondaryEmail,
  server_config : ServerConfiguration,
  server_log : ServerLog,
  user : User,
  user_assignment : UserAssignment,
  vial : Vial,
}

export class TracershopState {
  /** @type { User } */ logged_in_user
  /** @type { Date } */ today
  /** @type { Number } */ readyState
  /** @type { string } */ error 
  /** @type { Map<Number, Address>} */ address
  /** @type { Map<Number, ActivityOrder>} */ activity_orders
  /** @type { Map<Number, ClosedDate>} */ closed_date
  /** @type { Map<Number, Customer>} */ customer
  /** @type { Map<Number, Deadline>} */ deadline
  /** @type { Map<Number, ActivityDeliveryTimeSlot>} */ deliver_times
  /** @type { Map<Number, DicomEndpoint>} */ dicom_endpoint
  /** @type { Map<Number, DeliveryEndpoint>} */ delivery_endpoint
  /** @type { Map<Number, InjectionOrder>} */ injection_orders
  /** @type { Map<Number, Isotope>} */ isotopes
  /** @type { Map<Number, IsotopeDelivery>} */ isotope_delivery
  /** @type { Map<Number, IsotopeOrder>} */ isotope_order
  /** @type { Map<Number, IsotopeProduction>} */ isotope_production
  /** @type { Map<Number, IsotopeVial>} */ isotope_vial
  /** @type { Map<Number, ReleaseRight>} */ release_right
  /** @type { Map<Number, LegacyProductionMember>} */ legacy_production_member
  /** @type { Map<Number, Location>} */ location
  /** @type { Map<Number, Message>} */ message
  /** @type { Map<Number, MessageAssignment>} */ message_assignment
  /** @type { Map<Number, Tracer>} */ tracer
  /** @type { Map<Number, TracerCatalogPage>} */ tracer_mapping
  /** @type { Map<Number, Printer>} */ printer
  /** @type { Map<Number, Procedure>} */ procedure
  /** @type { Map<Number, ProcedureIdentifier>} */ procedure_identifier
  /** @type { Map<Number, ActivityProduction>} */ production
  /** @type { Map<Number, SecondaryEmail>} */ secondary_email
  /** @type { Map<Number, ServerConfiguration>} */ server_config
  /** @type { Map<Number, ServerLog>} */ server_log
  /** @type { Map<Number, User>} */ user
  /** @type { Map<Number, UserAssignment>} */ user_assignment
  /** @type { Map<Number, Vial>} */ vial

  constructor(logged_in_user, today, address, activity_orders, closed_date, customer, deadline, deliver_times, dicom_endpoint, delivery_endpoint, injection_orders, isotopes, isotope_delivery, isotope_order, isotope_production, isotope_vial, release_right, legacy_production_member, location, message, message_assignment, tracer, tracer_mapping, printer, procedure, procedure_identifier, production, secondary_email, server_config, server_log, user, user_assignment, vial, ){
    this.logged_in_user=logged_in_user
    this.today=today
   this.readyState = WebSocket.CLOSED
    if(address !== undefined){
      this.address = address
    } else {
      this.address = new Map()
    }
    if(activity_orders !== undefined){
      this.activity_orders = activity_orders
    } else {
      this.activity_orders = new Map()
    }
    if(closed_date !== undefined){
      this.closed_date = closed_date
    } else {
      this.closed_date = new Map()
    }
    if(customer !== undefined){
      this.customer = customer
    } else {
      this.customer = new Map()
    }
    if(deadline !== undefined){
      this.deadline = deadline
    } else {
      this.deadline = new Map()
    }
    if(deliver_times !== undefined){
      this.deliver_times = deliver_times
    } else {
      this.deliver_times = new Map()
    }
    if(dicom_endpoint !== undefined){
      this.dicom_endpoint = dicom_endpoint
    } else {
      this.dicom_endpoint = new Map()
    }
    if(delivery_endpoint !== undefined){
      this.delivery_endpoint = delivery_endpoint
    } else {
      this.delivery_endpoint = new Map()
    }
    if(injection_orders !== undefined){
      this.injection_orders = injection_orders
    } else {
      this.injection_orders = new Map()
    }
    if(isotopes !== undefined){
      this.isotopes = isotopes
    } else {
      this.isotopes = new Map()
    }
    if(isotope_delivery !== undefined){
      this.isotope_delivery = isotope_delivery
    } else {
      this.isotope_delivery = new Map()
    }
    if(isotope_order !== undefined){
      this.isotope_order = isotope_order
    } else {
      this.isotope_order = new Map()
    }
    if(isotope_production !== undefined){
      this.isotope_production = isotope_production
    } else {
      this.isotope_production = new Map()
    }
    if(isotope_vial !== undefined){
      this.isotope_vial = isotope_vial
    } else {
      this.isotope_vial = new Map()
    }
    if(release_right !== undefined){
      this.release_right = release_right
    } else {
      this.release_right = new Map()
    }
    if(legacy_production_member !== undefined){
      this.legacy_production_member = legacy_production_member
    } else {
      this.legacy_production_member = new Map()
    }
    if(location !== undefined){
      this.location = location
    } else {
      this.location = new Map()
    }
    if(message !== undefined){
      this.message = message
    } else {
      this.message = new Map()
    }
    if(message_assignment !== undefined){
      this.message_assignment = message_assignment
    } else {
      this.message_assignment = new Map()
    }
    if(tracer !== undefined){
      this.tracer = tracer
    } else {
      this.tracer = new Map()
    }
    if(tracer_mapping !== undefined){
      this.tracer_mapping = tracer_mapping
    } else {
      this.tracer_mapping = new Map()
    }
    if(printer !== undefined){
      this.printer = printer
    } else {
      this.printer = new Map()
    }
    if(procedure !== undefined){
      this.procedure = procedure
    } else {
      this.procedure = new Map()
    }
    if(procedure_identifier !== undefined){
      this.procedure_identifier = procedure_identifier
    } else {
      this.procedure_identifier = new Map()
    }
    if(production !== undefined){
      this.production = production
    } else {
      this.production = new Map()
    }
    if(secondary_email !== undefined){
      this.secondary_email = secondary_email
    } else {
      this.secondary_email = new Map()
    }
    if(server_config !== undefined){
      this.server_config = server_config
    } else {
      this.server_config = new Map()
    }
    if(server_log !== undefined){
      this.server_log = server_log
    } else {
      this.server_log = new Map()
    }
    if(user !== undefined){
      this.user = user
    } else {
      this.user = new Map()
    }
    if(user_assignment !== undefined){
      this.user_assignment = user_assignment
    } else {
      this.user_assignment = new Map()
    }
    if(vial !== undefined){
      this.vial = vial
    } else {
      this.vial = new Map()
    }
  this.error = "";
  }
}
