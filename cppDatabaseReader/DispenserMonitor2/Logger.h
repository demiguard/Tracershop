#pragma once
#include <fstream>
#include <ios>
#include <iostream>
#include <stdio.h>
#include <string>
#include <time.h>
//#include <windows.h>


class Logger {
public:
  typedef enum { NONE, L_ERROR, WARNING, MESSAGE, DEBUG } log_level_t;

  static Logger& get_logger() {
		static Logger logger;
		return logger;
  }
  ~Logger() {
    this->log_file.close();
  }

  // Init the logger so it is ready to be logged to
  bool init(std::wstring file_name, unsigned int log_size);

  // Set or get the log level
  void log_level(log_level_t log_level);
  void log_level(std::wstring log_level);
  log_level_t log_level() const;

  // Log functions
  void error(std::wstring msg);
  void warning(std::wstring msg);
  void message(std::wstring msg);
  void debug(std::wstring msg);

  // Display log level in a human readable format
  std::wstring pprint(log_level_t);


private:
	// Should be only be available to the class
	Logger() 
		: file_name(), log_file(), ready(false), current_log_level(MESSAGE)
	{}

	// Write current time to log file
	void log_time();

	std::wstring file_name;
	std::wofstream log_file;
	bool ready;
	log_level_t current_log_level;

	// Should not be available
	Logger(Logger const&);
	void operator=(Logger const&);
};
