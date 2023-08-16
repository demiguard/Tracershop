#pragma once
#include "stdafx.h"

std::vector<VAL> GetVALFromDB(std::wstring db_path, std::string sinceDate, Logger& logger);
