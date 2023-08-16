#pragma once
#include "stdafx.h"
class AdoQuery {
public:
	AdoQuery(const std::wstring& db_path);
	~AdoQuery(void);

	std::vector<VAL> getVALSince(const std::wstring& since_date);

private:
	void connect();
	void initCOM();

	std::wstring connection_string;
	ADODB::_ConnectionPtr connection;
};

