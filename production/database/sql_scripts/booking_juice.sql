Select
  SUM(tracer_units),
  database_tracer.shortname
from
  database_booking
    INNER JOIN database_procedureidentifier on database_booking.procedure_id=database_procedureidentifier.id
    INNER JOIN database_location on database_booking.location_id=database_location.id
    INNER JOIN database_procedure on database_procedure.series_description_id=database_procedureidentifier.id AND database_procedure.owner_id=database_location.endpoint_id
    INNER JOIN database_tracer on database_procedure.tracer_id=database_tracer.id
WHERE start_date="2024-10-04"
GROUP BY database_procedure.tracer_id;

SELECT TIME_TO_SEC(TIMEDIFF(start_time, '07:00:00')) / 60 from database_booking where start_date="2024-10-10";