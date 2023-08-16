#include "StdAfx.h"

const static int DEFAULT_MAPPINGS_SIZE = 16;
const static std::pair<std::wstring, std::wstring> default_mappings[DEFAULT_MAPPINGS_SIZE] = {
		std::make_pair(L"customer", L""),
		std::make_pair(L"part", L"0"),
		std::make_pair(L"charge", L""),
		std::make_pair(L"depotpos", L"0"),
		std::make_pair(L"filldatetime", L""),
		std::make_pair(L"filldate", L""),
		std::make_pair(L"filltime", L""),
		std::make_pair(L"activity", L""),
		std::make_pair(L"volume", L""),
		std::make_pair(L"gros", L"0 g"),
		std::make_pair(L"tare", L"0 g"),
		std::make_pair(L"net", L"0 g"),
		std::make_pair(L"product", L""),
		std::make_pair(L"syntesis", L""),
		std::make_pair(L"use_before", L""),
		std::make_pair(L"dispenser", L"UK465")
};

const static int DISPLAY_MAPPINGS_SIZE = 15;
const static std::wstring display_mappings[DISPLAY_MAPPINGS_SIZE] = {L"customer", L"part", L"charge", L"depotpos", L"filldate", L"filltime", L"activity", L"volume", L"gros", L"tare", L"net", L"product", L"syntesis", L"use_before", L"dispenser"};



VAL::VAL()
	: mappings(default_mappings, default_mappings + DEFAULT_MAPPINGS_SIZE)
{}

VAL::~VAL(void)
{}

std::wstring& VAL::operator[](const std::wstring& key) {
	return this->mappings[key];
}

bool VAL::write(std::wstring file_path) {
	 // Now lets write the val file
	Logger& logger = Logger::get_logger();
	logger.message(L"Writing to VAL file " + file_path);
	std::wofstream val_file;
	val_file.open(file_path);

	if (! val_file.good()) {
		logger.error(L"Error creating VAL file: " + file_path);
		std::wcerr << "Error creating VAL file: " << file_path.c_str() << std::endl;
    return false;
  }

  // We want padding to the right.
  val_file.setf(std::ios_base::left, std::ios_base::adjustfield);
  std::wcout.setf(std::ios_base::left, std::ios_base::adjustfield);

  std::wcout << "VAL file '" << file_path << "' created with following content:" << std::endl;

  for (size_t i = 0; i < DISPLAY_MAPPINGS_SIZE; ++i) {
	  val_file.width(12);
	  std::wstring key(display_mappings[i]);
	  std::wstring value(this->mappings[display_mappings[i]]);
	  key.append(L":");
	  val_file << key << value << std::endl;
	  std::wcout.width(12);
	  std::wcout << key << value << std::endl;
  }
  std::wcout << std::endl;
  // Do we need a check here?
  val_file.close();
  return true;
}