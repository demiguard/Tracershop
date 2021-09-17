DELIMITER $$

CREATE PROCEDURE InsertOrder (
  IN InAmount INT,
  IN InAmountOverhead INT,
  IN InBID INT,
  IN InDeliverDateTime DateTime,
  IN InComment VARCHAR(8000),
  IN InUsername VARCHAR(128),
  IN InRun Int
)
BEGIN
  DECLARE OldAmount INT DEFAULT 0;
  DECLARE OldOverhead INT DEFAULT 0;
  IF 0 < (
    SELECT COUNT(*)
    FROM orders
    WHERE
      deliver_datetime = InDeliverDateTime AND
      run = InRun AND
      BID = InBID
  ) 
  THEN
    
    SELECT amount INTO OldAmount 
    FROM orders 
    WHERE 
        deliver_datetime = InDeliverDateTime AND
        run = InRun AND
        BID = InBID;
    SELECT amount_o INTO OldOverhead
    FROM orders 
    WHERE 
      deliver_datetime = InDeliverDateTime AND
      run = InRun AND
      BID = InBID;
    UPDATE orders
    SET 
      amount         = OldAmount + InAmount,
      amount_o       = OldOverhead + InAmountOverhead,
      total_amount   = OldAmount + InAmount,
      total_amount_o = OldOverhead + InAmountOverhead
    WHERE
      deliver_datetime = InDeliverDateTime AND
        run = InRun AND
        BID = InBID;
  ELSE
    -- Insert New Order
    INSERT INTO orders(

      amount,
      amount_o,
      batchnr,
      BID,
      COID,
      comment,
      deliver_datetime,
      frigivet_datetime,
      run,
      status,
      total_amount,
      total_amount_o,
      tracer,
      userName
    ) VALUES (
      InAmount,
      InAmountOverhead,
      "",
      InBID,
      -1,
      InComment,
      InDeliverDateTime,
      "0000-01-01 00:00:0",
      InRun,
      1,
      InAmount,
      InAmountOverhead,
      6,
      InUsername
    ); 
END IF;
END$$ 
DELIMITER ;