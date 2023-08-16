#include "stdafx.h"
#include "Util.h"

bool read_file(std::wstring file_path, int max_number_of_lines, std::wstring &buffer) { 
  bool result(false);
  std::wifstream in_file;
  std::wstring line(L"");
  
  in_file.open(file_path.c_str(), std::ifstream::in);

  while (in_file.good() && max_number_of_lines > 0) {
    getline(in_file, line);
    buffer.append(line);
    result = true;
    --max_number_of_lines;
  }

  in_file.close();

  return result;
}

bool write_file(std::wstring file_path, std::wstring buffer) { 
  bool result(false);
  std::wofstream out_file;
  
  out_file.open(file_path.c_str(), std::ifstream::out);

  if (out_file.good()) {
    out_file.write(buffer.c_str(), buffer.size());
    result = true;
  }

  out_file.close();

  return result;
}

std::wstring sanitize_datetime(std::wstring datetime) {
  std::wstring out(datetime);
  std::wstring::iterator end = std::remove_if(out.begin(), out.end(), is_illegal_in_filename);
  out.resize(end - out.begin());
  
  return out;
}