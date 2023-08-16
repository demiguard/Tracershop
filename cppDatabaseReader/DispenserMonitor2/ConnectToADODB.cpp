/* Make a connection to the Jet DB at the given data_source_path
 * Returns a connection pointer.
 * Throws a _com_error exception if the connection setup fails.
 */
#include "stdafx.h"

ADODB::_ConnectionPtr ConnectToADODB(std::wstring data_source_path, Logger& logger) {
  HRESULT hr;
  std::wstring db_connect_string ( L"Provider=Microsoft.Jet.OLEDB.4.0;"
				   L"Data Source=" +
				   data_source_path );

  // Initialize the COM ...
  logger.debug(L"Initialising COM");
  hr = CoInitialize(NULL);
  if(FAILED(hr)) {
    logger.error(L"COM initialisation failed");
    throw(_com_error(hr));
  }

  // ... make a DB connection object ...
  logger.debug(L"Creating ADO connection instance");
  ADODB::_ConnectionPtr connection;
  hr = connection.CreateInstance(__uuidof(ADODB::Connection));
  if(FAILED(hr)) {
    logger.error(L"Error creating ADO connection instance");
    throw(_com_error(hr));
  }

  // ... connect to the DB ...
  logger.debug(L"Connecting to the DB");
  // I think we are missing some error checking here
  connection->CursorLocation = ADODB::adUseClient;
  connection->Open(db_connect_string.c_str(),
		   L"", 
		   L"", 
		   ADODB::adConnectUnspecified);
  return connection;
}