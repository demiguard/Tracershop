#include "StdAfx.h"
#include "Test.h"


Test::Test(void)
{
}


Test::~Test(void)
{
}

void Test::run_all() {
	try {
		testConfigParser();
	} catch(std::exception& e) {
		std::wcout << "Exception while testing: " << e.what() << std::endl;
	}
}

bool Test::testConfigParser() {
	std::wstring config_path(L"testConfigParser.data");
	std::wstring config_string(L"test: ok");
	write_file(config_path, config_string);

	std::unordered_map<std::wstring, std::wstring> config = parse_config(config_path);
	if (config.size() != 1) {
		std::wcout << "Wrong config size: " << config.size() << std::endl;
		return false;
	}
	if (config.count(L"test") != 1) {
		std::wcout << "Wrong config key." << std::endl;
		return false;
	}
	if (config[L"test"] != L"ok") {
		std::wcout << "Wrong config value: " << config[L"test"] << std::endl;
		return false;
	}

	std::wcout << "[OK] testConfigParser" << std::endl;
	return true;
}