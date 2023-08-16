#pragma once
class PathException : public std::exception {
public:
	PathException(std::wstring msg) : msg(msg) {}

	const std::wstring what() {
		return this->msg;
	}
private:
	std::wstring msg;
};

class FileChangeMonitor
{
public:
	FileChangeMonitor(std::wstring file_path);
	~FileChangeMonitor();

	void wait();
private:
	bool check_timestamp(std::wstring file_path, LPFILETIME last_write);
	std::wstring dir_path;
	std::wstring file_name;
	std::vector<byte> notification_buffer;
	HANDLE dir;
	FILETIME last_write;
};

