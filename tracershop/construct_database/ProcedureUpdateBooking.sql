DELIMITER $$

CREATE PROCEDURE UpdateBooking(
  IN InAccessionNumber VARCHAR(16),
  IN InStartDate DATE,
  IN InStartTime TIME,
  IN InLocation_id VARCHAR(16),
  IN InProcedure_id INT
)
BEGIN
  IF 0 < (
    SELECT COUNT(*)
    FROM customer_booking
    WHERE accessionNumber = InAccessionNumber )
  THEN
    IF (
      SELECT startDate
      FROM  customer_booking
      WHERE accessionNumber = InAccessionNumber
    ) < InStartDate THEN
      UPDATE
        customer_booking
      SET
        startDate = InStartDate,
        startTime = InStartTime,
        location_id = InLocation_id,
        procedure_id = InProcedure_id,
        status = 0
      WHERE
        accessionNumber = InAccessionNumber;
    ELSE
      UPDATE
        customer_booking
      SET
        startDate = InStartDate,
        startTime = InStartTime,
        location_id = InLocation_id,
        procedure_id = InProcedure_id
      WHERE
        accessionNumber = InAccessionNumber;
    END IF;
  ELSE
    INSERT INTO customer_booking(
      accessionNumber,
      startDate,
      startTime,
      location_id,
      procedure_id
    ) VALUES (
      InAccessionNumber,
      InStartDate,
      InStartTime,
      InLocation_id,
      InProcedure_id
    );
  END IF;

END $$
DELIMITER ;
