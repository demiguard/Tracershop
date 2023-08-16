/* Make a connection to the Jet DB at the given data_source_path
 * Returns a connection pointer.
 * Throws a _com_error exception if the connection setup fails.
 */
#include "stdafx.h"
ADODB::_ConnectionPtr ConnectToADODB(std::wstring data_source_path, Logger& logger);