// stdafx.h : include file for standard system include files,
// or project specific include files that are used frequently, but
// are changed infrequently
//

#pragma once

#include "targetver.h"

#include <iostream>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <ios>
#include <Shlwapi.h>
#include <string>
#include <stdexcept>
#include <stdio.h>
#include <tchar.h>
#include <regex>
#include <vector>
#include <unordered_map>
#include <utility>

// We want to use smart pointers, that take care of freeing resources
#import "C:\Program files\Common Files\System\Ado\msado15.dll" rename("EOF", "ADOEOF")



#include "ConfigParser.h"
#include "FileChangeMonitor.h"
#include "Logger.h"
#include "VAL.h"
#include "AdoQuery.h"
#include "Util.h"
#include "Test.h"
