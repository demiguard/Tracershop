#include "StdAfx.h"
#include "ConfigParser.h"

std::unordered_map<std::wstring, std::wstring> parse_config(std::wstring const& file_path) {
  std::wifstream in_file;
  std::wstring line(L"");
  size_t pos, key_pos, value_pos;
  std::unordered_map<std::wstring, std::wstring> mappings;

  in_file.open(file_path.c_str(), std::ifstream::in);
  if (!in_file.good()) {
	  throw PathException(L"Unable to open config file: " + file_path);
  }
  while (in_file.good()) {
    getline(in_file, line);
    if (line.size() > 2 && line.substr(0, 2).compare(L"//") != 0) {
      pos = line.find(L":");

      key_pos = line.find_last_not_of(' ', pos);
	  std::wstring key(line.substr(0, key_pos));

      value_pos = line.find_first_not_of(' ', pos+1);
      std::wstring value(line.substr(value_pos));

      mappings[key] = value;
    }
  }
  in_file.close();
  return mappings;
}