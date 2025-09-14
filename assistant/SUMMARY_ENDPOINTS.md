# Summary Endpoints Documentation

This document describes the new summary endpoints added to the Research Assistant API.

## Overview

The summary endpoints provide two types of project summaries:
1. **Overview Summary**: A comprehensive summary of the entire research project from the beginning
2. **Weekly Summary**: A focused summary of only the experiments and relationships updated in the last week

Both endpoints utilize the backend's `get_graph_overview` endpoint to fetch graph data and include intelligent caching for improved performance.

## Endpoints

### 1. Overview Summary

**GET** `/api/summaries/overview`

Generates a comprehensive summary of the entire research project.

#### Query Parameters

- `ignore_cache` (boolean, optional): If `true`, bypasses the cache and generates a fresh summary. Default: `false`

#### Response

```json
{
  "summary": "# Research Project Summary\n\n## Overview\nThis research project contains 15 experiments with 8 relationships between them...",
  "generated_at": "2025-01-13T10:30:00.000Z",
  "cache_hit": false,
  "node_count": 15,
  "edge_count": 8
}
```

#### Example Usage

```bash
# Get overview summary (uses cache if available)
curl "http://localhost:3001/api/summaries/overview"

# Force fresh summary generation
curl "http://localhost:3001/api/summaries/overview?ignore_cache=true"
```

### 2. Weekly Summary

**GET** `/api/summaries/weekly`

Generates a summary focusing only on experiments and relationships updated in the last 7 days.

#### Query Parameters

- `ignore_cache` (boolean, optional): If `true`, bypasses the cache and generates a fresh summary. Default: `false`

#### Response

```json
{
  "summary": "# Weekly Research Summary\n\n## Recent Updates\nThis week, 3 experiments were updated...",
  "generated_at": "2025-01-13T10:30:00.000Z",
  "cache_hit": false,
  "node_count": 3,
  "edge_count": 2
}
```

#### Example Usage

```bash
# Get weekly summary (uses cache if available)
curl "http://localhost:3001/api/summaries/weekly"

# Force fresh summary generation
curl "http://localhost:3001/api/summaries/weekly?ignore_cache=true"
```

### 3. Cache Statistics

**GET** `/api/summaries/cache/stats`

Returns cache statistics for debugging and monitoring purposes.

#### Response

```json
{
  "cache_stats": {
    "size": 2,
    "entries": [
      {
        "key": "overview:",
        "age": 120000,
        "expiresIn": 180000
      },
      {
        "key": "weekly:",
        "age": 60000,
        "expiresIn": 240000
      }
    ]
  },
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

#### Example Usage

```bash
curl "http://localhost:3001/api/summaries/cache/stats"
```

### 4. Clear Cache

**DELETE** `/api/summaries/cache`

Clears all cached summary data.

#### Response

```json
{
  "message": "Summary cache cleared successfully",
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

#### Example Usage

```bash
curl -X DELETE "http://localhost:3001/api/summaries/cache"
```

## Caching

### Cache Behavior

- **Cache TTL**: 5 minutes (300,000 milliseconds)
- **Cache Keys**: 
  - `overview:` for overview summaries
  - `weekly:` for weekly summaries
- **Automatic Cleanup**: Expired entries are automatically removed every 10 minutes
- **Cache Hit Detection**: The `cache_hit` field in responses indicates whether the data was served from cache

### Cache Invalidation

The cache is automatically invalidated when:
- The TTL expires (5 minutes)
- The `ignore_cache=true` parameter is used
- The cache is manually cleared via the DELETE endpoint

## Error Handling

All endpoints follow the standard error response format:

```json
{
  "error": "ErrorType",
  "message": "Detailed error message",
  "statusCode": 400,
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

### Common Error Scenarios

- **500 Internal Server Error**: Backend API unavailable or LLM service error
- **400 Bad Request**: Invalid query parameters
- **503 Service Unavailable**: Backend graph API not responding

## Implementation Details

### Data Flow

1. **Request Received**: Endpoint receives request with optional `ignore_cache` parameter
2. **Cache Check**: If `ignore_cache` is false, check cache for existing data
3. **Data Fetching**: If cache miss or `ignore_cache` is true, fetch graph data from backend
4. **Summary Generation**: Process graph data with LLM to generate summary
5. **Caching**: Store result in cache with 5-minute TTL
6. **Response**: Return summary with metadata

### Graph Data Processing

The service fetches data from the backend's `/graph/overview` endpoint and processes:

- **Nodes**: Experiment information including title, status, description, timestamps
- **Edges**: Relationships between experiments including type and labels
- **Filtering**: Weekly summaries filter nodes updated within the last 7 days

### LLM Integration

Currently uses a template-based approach for summary generation. The service is designed to easily integrate with:

- OpenAI API
- Anthropic Claude
- Other LLM services

The `generateSummaryWithLLM` method can be extended to call actual LLM services.

## Testing

A test script is provided to verify endpoint functionality:

```bash
# Make sure the assistant server is running first
npm start

# In another terminal, run the test
node test-summary-endpoints.js
```

## Configuration

### Environment Variables

- `GRAPH_API_BASE`: Backend API base URL (default: `http://127.0.0.1:8000`)
- `ASSISTANT_PORT`: Assistant server port (default: `3001`)

### Cache Configuration

The cache TTL can be modified in the `SummaryService` constructor:

```typescript
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

## Future Enhancements

1. **LLM Integration**: Replace template-based summaries with actual LLM calls
2. **Custom Time Ranges**: Allow custom date ranges for weekly summaries
3. **Summary Formats**: Support different output formats (JSON, HTML, PDF)
4. **Real-time Updates**: WebSocket support for real-time summary updates
5. **Advanced Caching**: Redis-based distributed caching
6. **Summary Templates**: Customizable summary templates per project
