#pragma once
#include "stdafx.h"

class VAL
{
public:
	VAL();
	VAL(const VAL& other)
		: mappings(other.mappings)
	{}
	~VAL(void);

	friend void swap(VAL& first, VAL& second) {
		using std::swap;
		swap(first.mappings, second.mappings);
	}

	VAL& operator=(VAL other) {
		swap(*this, other);
		return *this;
	}

	bool write(std::wstring file_path);

	std::wstring& operator[](const std::wstring& key);
	//const std::wstring& operator[](const std::wstring& key) const;

	std::unordered_map<std::wstring, std::wstring> mappings;
private:
};
