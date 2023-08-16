// DispenserMonitor2.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"

const std::wstring config_file_path( L"config.txt" );

int _tmain(int argc, _TCHAR* argv[]) {
	if (argc == 2) {
		std::wcout << "Testing" << std::endl;
		Test test;
		test.run_all();
		return 0;
	}

	try {
		std::unordered_map<std::wstring, std::wstring> config = parse_config(config_file_path);
		std::wcout << "Parsed config from " << config_file_path << std::endl;

		// Verify the config
		// Check that directory paths end with '/'
		
		std::wstring log_file_path(config[L"log_dir_path"] + L"DispenserMonitor_.log");
		int max_log_size = _wtoi(config[L"max_log_size"].c_str());

		Logger& logger = Logger::get_logger();
		if (logger.init(log_file_path, max_log_size)) {
			logger.log_level(config[L"log_level"]);
			logger.message(L"Logging initialised");
			std::wcout << "Logging to: " << log_file_path << std::endl;
		} else {
			std::wcerr << "Error initialising logger"  << std::endl;
		}
		
		const std::wstring db_path(config[L"db_dir_path"] + config[L"db_file_name"]);
		logger.debug(L"Using DB path: " + db_path);
		
		std::wstring last_fill_time;
		read_file(config[L"last_time_file_path"], 1, last_fill_time);
		logger.debug(L"Last fill time was " + last_fill_time); 
		
		std::unordered_map<std::wstring, std::wstring> customers = parse_config(config[L"customers_file_path"]);
		logger.debug(L"Read " + std::to_wstring(static_cast<_Longlong>(customers.size())) + L" customers");
		try {
			FileChangeMonitor monitor(db_path);
			AdoQuery query(db_path);
			std::wcout << "Ready." << std::endl;
			while(true) {
				monitor.wait();
				std::vector<VAL> vals(query.getVALSince(last_fill_time));
				for (size_t i = 0; i < vals.size(); ++i) {
					last_fill_time = vals[i][L"datetime"];
					if (customers.count(vals[i][L"customer"]) > 0) {
						vals[i][L"customer"] = customers[vals[i][L"customer"]] + L"-" + vals[i][L"customer"];
						std::wstring val_path = config[L"val_dir_path"] + L"VAL." + sanitize_datetime(last_fill_time);
						logger.debug(L"Writing to " + val_path);
						vals[i].write(val_path);
					} else {
						logger.error(L"Unknown customer: " + vals[i][L"customer"]);
					}
					write_file(config[L"last_time_file_path"], last_fill_time);
				}
			}
		} catch (PathException& e) {
			logger.error(e.what());
		}
	} catch (std::out_of_range &e) {
		std::wcout << e.what() << std::endl;
	} catch (PathException &e) {
		std::wcout << e.what() << std::endl;
	} catch (_com_error &e) {
		std::wcout << e.ErrorMessage() << " : " << e.Description() << std::endl;
	} catch (std::exception &e) {
		std::wcout << e.what() << std::endl;
	}
	
	std::wcout << "Press any key to exit.";
	std::wcin.get();

  return 0;
}

