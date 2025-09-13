# Research Assistant API Reference

## Base URL

```
http://127.0.0.1:8000
```

## Experiment Nodes

### Create Node

```http
POST /nodes

Request Body:
{
    "title": "PCR Optimization",
    "description": "Optimizing PCR conditions for DNA amplification",
    "motivation": "Improve amplification efficiency",
    "expectations": "Find optimal temperature and primer conditions"
}

Response:
{
    "id": 1,
    "title": "PCR Optimization",
    "description": "Optimizing PCR conditions for DNA amplification",
    "motivation": "Improve amplification efficiency",
    "expectations": "Find optimal temperature and primer conditions",
    "status": "planned",
    "hypothesis": null,
    "result": null,
    "extra_data": null,
    "created_at": "2025-09-13T04:57:49",
    "updated_at": "2025-09-13T04:57:49"
}
```

### Get Node Info

```http
GET /nodes/{node_id}?with_parents=true&with_children=true

Response:
{
    "node": {
        "id": 2,
        "title": "DNA Sequencing",
        "description": "Sequencing amplified DNA samples",
        ...
    },
    "parents": [
        {
            "id": 1,
            "title": "PCR Optimization",
            "description": "Optimizing PCR conditions...",
            "relationship": "leads_to"
        }
    ],
    "children": []
}
```

### Get All Nodes (Concise)

```http
GET /nodes?concise=true

Response:
[
    {
        "id": 1,
        "title": "PCR Optimization",
        "display_text": "Optimizing PCR conditions...",
        "status": "planned",
        "type": "experiment"
    },
    ...
]
```

## Relationships (Edges)

### Create Edge

```http
POST /edges

Request Body:
{
    "from_experiment_id": 1,
    "to_experiment_id": 2,
    "relationship_type": "leads_to",
    "label": "PCR products for sequencing"
}

Response:
{
    "id": 1,
    "from_experiment_id": 1,
    "to_experiment_id": 2,
    "relationship_type": "leads_to",
    "label": "PCR products for sequencing",
    "extra_data": null,
    "created_at": "2025-09-13T04:58:00"
}
```

## Graph Overview

### Get Full Graph

```http
GET /graph/overview

Response:
{
    "nodes": [
        {
            "id": 1,
            "title": "PCR Optimization",
            "status": "planned",
            "type": "experiment",
            "description": "Optimizing PCR conditions for DNA amplification"
        },
        {
            "id": 2,
            "title": "DNA Sequencing",
            "status": "planned",
            "type": "experiment",
            "description": "Sequencing amplified DNA samples"
        }
    ],
    "edges": [
        {
            "id": 1,
            "from": 1,
            "to": 2,
            "type": "leads_to",
            "label": "PCR products for sequencing"
        }
    ]
}
```

## Context Keywords

### Add Keyword

```http
POST /context-keywords?keyword=PCR optimization

Response:
{
    "success": true
}
```

### Get All Keywords

```http
GET /context-keywords

Response:
[
    "PCR optimization",
    "DNA sequencing"
]
```

### Delete Keyword

```http
DELETE /context-keywords/{keyword}

Response:
{
    "success": true
}
```

## Literature References

### Add Literature to Node

```http
POST /nodes/{node_id}/literature?link=https://doi.org/10.1000/pcr123

Response:
{
    "success": true
}
```

### Get Node's Literature

```http
GET /nodes/{node_id}/literature

Response:
[
    "https://doi.org/10.1000/pcr123"
]
```

### Delete Literature from Node

```http
DELETE /nodes/{node_id}/literature/{encoded_link}

Response:
{
    "success": true
}
```

## Additional Operations

### Update Node

```http
PATCH /nodes/{node_id}

Request Body:
{
    "description": "Updated description",
    "extra_data": {
        "node_type": "experiment",
        "completion_status": "done"
    }
}
```

### Delete Node

```http
DELETE /nodes/{node_id}?force_delete=true

Response:
{
    "success": true
}
```

Note: `force_delete=true` will delete the node and all its descendants in the graph.

## Status Codes

- 200: Success
- 400: Bad Request (e.g., duplicate entry, invalid data)
- 404: Not Found
- 500: Server Error

## Interactive Documentation

Full API documentation is available at:

```
http://127.0.0.1:8000/docs
```
