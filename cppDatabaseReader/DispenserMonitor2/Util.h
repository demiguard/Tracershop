#pragma once
#include "stdafx.h"

// Used to read/write the last_fill_time file
bool read_file(std::wstring file_path, int max_number_of_lines, std::wstring &buffer);
bool write_file(std::wstring file_path, std::wstring buffer);

inline bool is_illegal_in_filename(char c) { return c == ' ' || c == '/' || c == ':'; }

std::wstring sanitize_datetime(std::wstring datetime);