#include "StdAfx.h"
#include "AdoQuery.h"


AdoQuery::AdoQuery(const std::wstring& db_path)
	: connection_string(L"Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + db_path),
	  connection()
{
	this->initCOM();
}

void AdoQuery::initCOM() {
	Logger& logger = Logger::get_logger();
	logger.debug(L"Initialising COM");
	HRESULT hr = CoInitializeEx(NULL, COINIT_APARTMENTTHREADED);
	if(FAILED(hr)) {
		logger.error(L"COM initialisation failed");
		throw(_com_error(hr));
	}
}

AdoQuery::~AdoQuery(void) {
	Logger& logger = Logger::get_logger();
	logger.debug(L"Uninitialising COM");
	CoUninitialize();
}

void AdoQuery::connect() {
	Logger& logger = Logger::get_logger();
	logger.debug(L"Creating ADO connection instance");
	HRESULT hr = this->connection.CreateInstance(__uuidof(ADODB::Connection));
	if(FAILED(hr)) {
		logger.error(L"Error creating ADO connection instance");
		throw(_com_error(hr));
	}

	logger.debug(L"Connecting to the DB");
	// I think we are missing some error checking here
	this->connection->CursorLocation = ADODB::adUseClient;
	this->connection->Open(this->connection_string.c_str(), L"", L"", ADODB::adConnectUnspecified);
}

std::vector<VAL> AdoQuery::getVALSince(const std::wstring& since_date) {
	Logger& logger = Logger::get_logger();
	// Verify we got a date string of the form 2012/09/15 11:10:18
	std::wregex date_format(L"\\d{4}/\\d{2}/\\d{2} \\d{2}:\\d{2}:\\d{2}");
	if (!std::regex_match(since_date, date_format)) {
		logger.error(L"since_date does not match dateformat");
		return std::vector<VAL>();
	}

	this->connect();

	//// Make a recordset object to hold the query result ...
	logger.debug(L"Creating a recordset");
	ADODB::_RecordsetPtr recordset;
	HRESULT hr = recordset.CreateInstance(__uuidof(ADODB::Recordset));
	if(FAILED(hr)) {
		logger.error(L"Error creating recordset");
		throw(_com_error(hr));
	}

	try {
		logger.debug(L"Querying DB for the most recent entry ");
		std::wstring query_string(L"SELECT "
								 L"Code1CustomerName AS [customer], "
								 L"Lot AS [charge], "
								 L"EndFillingTime as [time],"
								 L"ActivityatTimeofMeas AS [activity], "
								 L"TotalVolume AS [volume], "
								 L"IsotopeName AS [product], "
								 L"ToBeUsedBefore AS [use_before] "
								 L"FROM DischargeTable "
								 L"WHERE EndFillingTime > '" + since_date + L"' "
								 L"ORDER BY EndFillingTime ASC");
		recordset->Open(query_string.c_str(),
						connection.GetInterfacePtr(),
						ADODB::adOpenForwardOnly,
						ADODB::adLockReadOnly,
						ADODB::adCmdText);
	} catch(_com_error &e) {
		logger.error(L"Error executing query on DB:" + std::wstring(e.ErrorMessage()) + L" : " + std::wstring(e.Description()));
		throw(e);
	}

	// Create the VAL objects
	std::vector<VAL> vals;
	try {
		for (; ! recordset->ADOEOF; recordset->MoveNext()) {
			VAL val;

			// Get the customer info
			_variant_t var = recordset->Fields->GetItem(L"customer")->GetValue();
			val[L"customer"] = _bstr_t(var.bstrVal);
			logger.debug(L"Got customer: " + val[L"customer"]);
  
			// Get the charge
			var = recordset->Fields->GetItem(L"charge")->GetValue();
			val[L"charge"] = _bstr_t(var.bstrVal);
			logger.debug(L"Got charge: " + val[L"charge"]);

			// Get the fill time and split it in date and time
			var = recordset->Fields->GetItem(L"time")->GetValue();
			val[L"datetime"] = _bstr_t(var.bstrVal); 
			logger.debug(L"Got datetime: " + val[L"datetime"]);
			size_t pos = val[L"datetime"].find(L" ");
			val[L"filldate"] = val[L"datetime"].substr(2, pos - 2);
			logger.debug(L"Got date: " + val[L"filldate"]);
			val[L"filltime"] = val[L"datetime"].substr(pos + 1);
			logger.debug(L"Got time: " + val[L"filltime"]);

			// Get the activity and strip the " at <datetime>" suffix
			var = recordset->Fields->GetItem(L"activity")->GetValue();
			val[L"activity"] = _bstr_t(var.bstrVal);
			pos = val[L"activity"].find(L" at");
			val[L"activity"] = val[L"activity"].substr(0, pos);

			// Get the volume
			var = recordset->Fields->GetItem(L"volume")->GetValue();
			val[L"volume"] = _bstr_t(var.bstrVal);

			// Get the product
			var = recordset->Fields->GetItem(L"product")->GetValue();
			val[L"product"] = _bstr_t(var.bstrVal);

			// Get use_before
			var = recordset->Fields->GetItem(L"use_before")->GetValue();
			val[L"use_before"] = _bstr_t(var.bstrVal);
			vals.push_back(val);
		}
		recordset->Close();
	} catch(_com_error &e) {
		logger.error(L"Error while iterating through the recordset" + std::wstring(e.ErrorMessage()) + L" : " + std::wstring(e.Description()));
		throw(e);
	} 
    return vals;

}