# Python Standard library
import asyncio
import logging

# Third party packages
from channels.db import database_sync_to_async

# Tracershop models
from constants import DEBUG_LOGGER
from database.models import TelemetryRequest, TelemetryRecord, TelemetryRecordStatus

@database_sync_to_async
def _sync_create_telemetry_record(message_key: str, latency_ms: float, status: TelemetryRecordStatus):
  message_type, created = TelemetryRequest.objects.get_or_create(message_key=message_key)
  TelemetryRecord.objects.create(
    request_type=message_type,
    latency_ms=latency_ms,
    status=status
  )

async def _create_telemetry_record(message_key: str, latency_ms: float, status: TelemetryRecordStatus):
  await _sync_create_telemetry_record(message_key, latency_ms, status)

async def create_telemetry_record(message_key: str, latency_ms: float, status: TelemetryRecordStatus):
  _ = asyncio.create_task(_create_telemetry_record(message_key, latency_ms, status))
