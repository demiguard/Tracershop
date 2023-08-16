#include "StdAfx.h"
#include "FileChangeMonitor.h"


FileChangeMonitor::FileChangeMonitor(std::wstring file_path)
	: dir_path(), file_name(), notification_buffer(), dir(), last_write() 
{
	Logger& logger = Logger::get_logger();

	size_t pos = file_path.find_last_of('/');
	this->dir_path = file_path.substr(0, pos+1);
	this->file_name = file_path.substr(pos+1);

	this->notification_buffer.resize(sizeof(FILE_NOTIFY_INFORMATION) + MAX_PATH);

	// Open the directory containing the file we want to watch
	logger.debug(L"Opening  " + dir_path);
	this->dir = CreateFile(dir_path.c_str(),
						   GENERIC_READ,
		                   FILE_SHARE_DELETE | FILE_SHARE_READ | FILE_SHARE_WRITE,
		                   NULL,
		                   OPEN_EXISTING,
		                   FILE_FLAG_BACKUP_SEMANTICS,
		                   NULL);
   if (this->dir == INVALID_HANDLE_VALUE) {
	   logger.error(L"Unable to open directory " + dir_path);
	   throw PathException(L"Path: " + dir_path + L" is not a readable directory");
  }
}

FileChangeMonitor::~FileChangeMonitor() {
	CloseHandle(dir);
}

void FileChangeMonitor::wait() {
	Logger& logger = Logger::get_logger();
	DWORD result_len(0);
	logger.debug(L"Waiting for changes to directory " + this->dir_path);
	while(true) {
		// Wait for any changes in the directory, this call blocks.
		bool result = ReadDirectoryChangesW(this->dir,
											&(this->notification_buffer[0]),
											this->notification_buffer.size(),
											false,
											FILE_NOTIFY_CHANGE_LAST_WRITE,
											(LPDWORD) &result_len,
											NULL,
											NULL);
		if (!result) {
			logger.error(L"Error while waiting for changes to directory " + dir_path);
			throw PathException(L"Error while waiting for changes to directory " + dir_path);
		}
		
		// Check if it is the file we want
		PFILE_NOTIFY_INFORMATION file_info = (PFILE_NOTIFY_INFORMATION)&(this->notification_buffer[0]);
		// We use 2 bytes per character and FileNameLength is given in bytes, so we divide by 2.
		std::wstring changed_file_name (file_info->FileName, file_info->FileNameLength / 2);
		if (0 == this->file_name.compare(changed_file_name)) {
			if (check_timestamp(this->dir_path + this->file_name, (LPFILETIME) &(this->last_write))) {
				logger.debug(L"Write to DB detected");
				return;
			} else {
				logger.debug(L"Ignoring write to DB because not enough time have passed since last write");
			}
		} else {
			logger.debug(L"Ignoring changes to " + changed_file_name);
		}
	}
}


bool FileChangeMonitor::check_timestamp(std::wstring file_path, LPFILETIME last_write) {
	Logger& logger = Logger::get_logger();
  // We can get 2 updates with different timestamp, that are comming from
  // the same write operation. I assume it is because of NTFS journaling.
  // We use a precision of 1 milisecond, it is based on observation
  // and needs to be verified.
  DWORD file_write_time_epsilon(1000000); // 1 millisecond in nanoseconds
  FILETIME this_write;
  HANDLE file;
  bool result(false);
  
  logger.debug(L"Opening file: " + file_path);
  file = CreateFile(file_path.c_str(),
		    GENERIC_READ,
		    FILE_SHARE_DELETE | FILE_SHARE_READ | FILE_SHARE_WRITE,
		    NULL,
		    OPEN_EXISTING,
		    FILE_FLAG_BACKUP_SEMANTICS,
		    NULL);
      
  if (file == INVALID_HANDLE_VALUE) {
	  logger.error(L"Unable to open file: " + file_path);
	  throw PathException(L"Unable to open file: " + file_path);
  }

  logger.debug(L"Getting timestamp");
  GetFileTime(file, NULL, NULL, (LPFILETIME) &this_write);
  if (this_write.dwHighDateTime != last_write->dwHighDateTime ||
      this_write.dwLowDateTime - last_write->dwLowDateTime > file_write_time_epsilon) {
		  logger.debug(L"This write is after last write");
		  *last_write = this_write;
		  result = true;
  }
  CloseHandle(file);
  return result;
}