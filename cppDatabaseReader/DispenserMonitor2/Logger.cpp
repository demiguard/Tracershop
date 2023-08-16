#include "stdafx.h"
#include "Logger.h"

bool Logger::init(std::wstring file_name, unsigned int max_log_size) {
	if (this->ready) {
		return false;
	}

  HANDLE file;
  LARGE_INTEGER file_size;

  /* Check if we should rotate the log */
  file = CreateFile(file_name.c_str(),
		    GENERIC_READ,
		    FILE_SHARE_DELETE | FILE_SHARE_READ | FILE_SHARE_WRITE,
		    NULL,
		    OPEN_EXISTING,
		    FILE_FLAG_BACKUP_SEMANTICS,
		    NULL);
      
  if (file != INVALID_HANDLE_VALUE) {
    if (GetFileSizeEx(file, &file_size) &&
	file_size.LowPart > max_log_size &&
	CopyFile(file_name.c_str(), std::wstring(file_name + L".old").c_str(), false)) {
		DeleteFile(file_name.c_str());
    }
    CloseHandle(file);
  }

  /* Initialise the log */
  this->log_file.open(file_name.c_str(), std::ios_base::app);
  if (! this->log_file.good() ) {
    std::wcerr << "Unable to open log file: " << file_name << std::endl;
    return false;
    this->ready = false;
  } 
    
  this->ready = true;
  this->message(L"Logger ready");
  return true;
}


void Logger::log_level(log_level_t log_level) {
  if (log_level >= L_ERROR && log_level <= DEBUG) {
    this->current_log_level = log_level;
    this->message(std::wstring(L"Log level changed to ").append(this->pprint(log_level)));
  }
}

void Logger::log_level(std::wstring log_level) {
  if (log_level.compare(L"NONE") == 0) {
    this->current_log_level = Logger::NONE;
  }
  else if (log_level.compare(L"ERROR") == 0) {
    this->current_log_level = Logger::L_ERROR;
  }
  else if (log_level.compare(L"WARNING") == 0) {
    this->current_log_level = Logger::WARNING;
  }
  else if (log_level.compare(L"MESSAGE") == 0) {
    this->current_log_level = Logger::MESSAGE;
  }
  else if (log_level.compare(L"DEBUG") == 0) {
    this->current_log_level = Logger::DEBUG;
  }
  else {
    return;
  }
  this->message(std::wstring(L"Log level changed to ").append(this->pprint(this->current_log_level)));
}

Logger::log_level_t Logger::log_level() const {
  return this->current_log_level;
}

void Logger::error(std::wstring msg) {
  if (this->ready && this->current_log_level >= Logger::L_ERROR) {
    this->log_time();
    this->log_file << L"[ERROR]   " << msg.c_str() << std::endl; 
  }
}

void Logger::warning(std::wstring msg) {
  if (this->ready && this->current_log_level >= Logger::WARNING) {
    this->log_time();
    this->log_file << L"[WARNING] " << msg.c_str() << std::endl; 
  }
}

void Logger::message(std::wstring msg) {
  if (this->ready && this->current_log_level >= Logger::MESSAGE) {
    this->log_time();
    this->log_file << L"[MESSAGE] " << msg.c_str() << std::endl; 
  }
}

void Logger::debug(std::wstring msg) {
  if (this->ready && this->current_log_level >= Logger::DEBUG) {
    this->log_time();
    this->log_file << L"[DEBUG]   " << msg.c_str() << std::endl; 
  }
}

void Logger::log_time() {
  time_t epoch_time;
  struct tm timeinfo;
  char buffer[21];

  if (time(&epoch_time) != -1) {
    if (localtime_s(&timeinfo, &epoch_time) == 0) {
      strftime(buffer, 21, "%Y/%m/%d %H:%M:%S ", &timeinfo);
      this->log_file << buffer; 
    }
    else {
      this->log_file << "Error converting time" << std::endl;
    }
  }
  else {
    this->log_file << "Error getting time" << std::endl;
  }
}

std::wstring Logger::pprint(log_level_t log_level) {
  switch (log_level) {
  case NONE: 
    return L"NONE";
  case L_ERROR: 
    return L"ERROR";
  case WARNING: 
    return L"WARNING";
  case MESSAGE: 
    return L"MESSAGE";
  case DEBUG: 
    return L"DEBUG";
  default:
    return L"";
  }
}
