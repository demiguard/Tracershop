CREATE TABLE IF NOT EXISTS tracer_types(
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(300) DEFAULT ""
);

INSERT INTO tracer_types(
  description
) VALUES ("Activity Tracer"), ("Dose Tracer");

ALTER TABLE Tracers
  ADD COLUMN tracer_type INT ,
  ADD CONSTRAINT fk_tracer_type FOREIGN KEY (tracer_type)
    REFERENCES tracer_types(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;


UPDATE Tracers
  SET tracer_type=2;

UPDATE Tracers
  SET tracer_type=1
  WHERE id=6;