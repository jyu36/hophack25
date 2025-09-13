# Bug Report

## Backend API Issues

### 1. `/nodes` endpoint validation error when `concise=true`

**Description**: The `/nodes?concise=true` endpoint returns a 500 Internal Server Error due to response validation failure.

**Error Details**:
```
fastapi.exceptions.ResponseValidationError: 4 validation errors:
{'type': 'missing', 'loc': ('response', 0, 'created_at'), 'msg': 'Field required', 'input': {'id': 1, 'title': 'PCR Optimization', 'display_text': 'Optimizing PCR conditions for DNA amplification', 'status': <ExperimentStatus.PLANNED: 'planned'>, 'type': 'experiment'}}
{'type': 'missing', 'loc': ('response', 0, 'updated_at'), 'msg': 'Field required', 'input': {'id': 1, 'title': 'PCR Optimization', 'display_text': 'Optimizing PCR conditions for DNA amplification', 'status': <ExperimentStatus.PLANNED: 'planned'>, 'type': 'experiment'}}
```

**Root Cause**: The endpoint returns a list of dictionaries when `concise=true`, but the response model expects `List[schemas.Experiment]` which requires `created_at` and `updated_at` fields that are missing from the concise response.

**Location**: `backend/app/api/endpoints/experiments.py` - `get_all_nodes` function

**Impact**: The assistant cannot retrieve a list of nodes in concise format, causing tool execution failures.

### 2. Schema mismatch in NodeInfo

**Description**: The `NodeInfo` schema expects `incoming_relationships` and `outgoing_relationships` fields, but the API returns `parents` and `children`.

**Location**: `backend/app/schemas/experiment.py` - `NodeInfo` class

**Impact**: Potential validation errors when using the `/nodes/{node_id}` endpoint.

### 3. Missing response model for concise node list

**Description**: There's no dedicated schema for the concise node response format, causing validation errors.

**Suggested Fix**: Create a `ExperimentConcise` schema or similar to properly validate the concise response format.

## Assistant Issues

### 4. Tool error handling could be improved

**Description**: When API calls fail, the assistant shows generic error messages and doesn't provide helpful guidance to users about what went wrong.

**Impact**: Poor user experience when backend issues occur.

### 5. Demo scenarios may fail due to backend issues

**Description**: The demo script assumes all backend endpoints work correctly, but some endpoints have validation issues.

**Impact**: Demo doesn't showcase the full functionality when backend has bugs.

## Workaround

For now, the assistant can use the `/graph/overview` endpoint which works correctly, or the full `/nodes` endpoint (without `concise=true` parameter) to retrieve experiment data.
