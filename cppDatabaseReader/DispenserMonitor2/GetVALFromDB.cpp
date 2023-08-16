#include "stdafx.h"

std::vector<VAL> GetVALFromDBSinceDate(std::wstring db_path, std::string sinceDate, Logger &logger) {
	logger.debug(L"GetLastVALFromDB called with db_path = " + db_path); 
	try {
		ADODB::_ConnectionPtr connection = ConnectToADODB(db_path, logger);
	} catch(_com_error &e) {
		logger.error(L"Unable to connect to DB at " + db_path);
		throw(e);
	}

	// Make a recordset object to hold the query result ...
	logger.debug(L"Creating a recordset");
	ADODB::_RecordsetPtr recordset;
	HRESULT hr = recordset.CreateInstance(__uuidof(ADODB::Recordset));
	if(FAILED(hr)) {
		logger.error(L"Error creating recordset");
		throw(_com_error(hr));
	}

	try {
		logger.debug(L"Querying DB for the most recent entry ");
		recordset->Open("SELECT "
					    "Code1CustomerName AS [customer], "
						"Lot AS [charge], "
						"EndFillingTime as [time],"
						"ActivityatTimeofMeas AS [activity], "
						"TotalVolume AS [volume], "
						"IsotopeName AS [product], "
						"ToBeUsedBefore AS [use_before] "
						"FROM DischargeTable "
						"WHERE EndFillingTime > " + sinceDate + " " /* Ripe for SQL injection...*/
						"ORDER BY EndFillingTime DESC",
						connection.GetInterfacePtr(),
						ADODB::adOpenForwardOnly,
						ADODB::adLockReadOnly,
						ADODB::adCmdText);
	} catch(_com_error &e) {
		logger.error(L"Error executing query on DB");
		throw(e);
	}

	// Create the VAL objects
	std::vector<VAL> vals;
	try {
		for (; ! recordset->ADOEOF; recordset->MoveNext()) {
			VAL val;

			// Set part, depotpos to 0. Needed for backwards compatibility with VAL format
			val.part = val.depotpos = L"0";

			// Set gross, tare, net to 0 g. Not used but needed for compatibility
			val.gros = val.tare = val.net = L"0 g";

			// Get the customer info
			_variant_t var = recordset->Fields->GetItem(L"customer")->GetValue();
			val.customer = _bstr_t(var.bstrVal);
			logger.debug(L"Got customer: " + val.customer);
  
			// Get the charge
			var = recordset->Fields->GetItem(L"charge")->GetValue();
			val.charge = _bstr_t(var.bstrVal);

			// Get the fill time and split it in date and time
			var = recordset->Fields->GetItem(L"time")->GetValue();
			std::wstring datetime(_bstr_t(var.bstrVal)); 
			logger.debug(L"Got datetime: " + datetime);
			size_t pos = datetime.find(L" ");
			val.filldate = datetime.substr(2, pos - 2);
			logger.debug(L"Got date: " + val.filldate);
			val.filltime = date.substr(pos + 1);
			logger.debug(L"Got time: " + val.filltime);

			// Get the activity and strip the " at <datetime>" suffix
			var = recordset->Fields->GetItem(L"activity")->GetValue();
			val.activity = _bstr_t(var.bstrVal);
			pos = activity.find(L" at");
			activity = activity.substr(0, pos);

			// Get the volume
			var = recordset->Fields->GetItem(L"volume")->GetValue();
			val.volume = _bstr_t(var.bstrVal);

			// Get the product
			var = recordset->Fields->GetItem(L"product")->GetValue();
			val.product = _bstr_t(var.bstrVal);

			// Get use_before
			var = recordset->Fields->GetItem(L"use_before")->GetValue();
			val.use_before = _bstr_t(var.bstrVal);
		}
		recordset->Close();
	} catch(_com_error &e) {
		logger.error(L"Error while iterating through the recordset");
		throw(e);
	} 
    return vals;
}