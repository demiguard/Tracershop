import { createElement } from "htmlHelpers.js"
import { constructElement } from "./htmlHelpers"
import { ROW_DATA, ROW_ID } from "./Constants.js";
export { Table }


class Table {
  constructor(HeaderRows=[], Rows=[]){
    this.Table = constructElement("table", classList=["table"])
    this.thead = constructElement("thead");
    this.Columns = {};
    HeaderColumns.forEach(ColumnName, index => {
      const Column = constructElement("th", content=ColumnName);
      this.thead.append(Column);
      this.Column[index] = ColumnName;
    });
    this.Table.append(this.thead);
    this.Tbody = constructElement("tbody")
    this.Rows = {}
    Rows.forEach
  }

  getTable() {return this.Table};
  getHead() {return this.thead};
  getBody() {return this.Tbody}

}