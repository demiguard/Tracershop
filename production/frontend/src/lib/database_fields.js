export class DatabaseField {
  constructor(name){
    this.name = name
  }
};

export class CharField extends DatabaseField {
  constructor(name){
    super(name);
  }
}

export class IntField extends DatabaseField {
  constructor(name){
    super(name);
  }
}

export class FloatField extends DatabaseField {
  constructor(name){
    super(name);
  }
}

export class ForeignField extends DatabaseField {
  constructor(name, related_to){
    super(name);
    this.related_to = related_to;
  }
}
