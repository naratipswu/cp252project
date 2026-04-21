# Performance Profiling: Phase 4

**Date**: 2026-04-21  
**Target**: `http://localhost:3000`

## Results

### 1. Homepage (`GET /`)
- **Requests**: 37,895
- **Throughput**: 642,117,032.00 req/s
- **Latency Mean**: 7.41 ms
- **Latency P99**: 25 ms

### 2. Camera List (`GET /cameras`)
- **Requests**: 206,376
- **Throughput**: 123,334,862.00 req/s
- **Latency Mean**: 0.89 ms
- **Latency P99**: 5 ms

### 3. Search Cameras (`GET /cameras?search=Canon`)
- **Requests**: 339,649
- **Throughput**: 202,982,181.00 req/s
- **Latency Mean**: 0.27 ms
- **Latency P99**: 3 ms

### 4. Register Page (`GET /register`)
- **Requests**: 331,458
- **Throughput**: 198,419,348.00 req/s
- **Latency Mean**: 0.29 ms
- **Latency P99**: 3 ms

### 5. Admin Dashboard (`GET /admin/dashboard`)
- **Requests**: 363,664
- **Throughput**: 157,693,500.00 req/s
- **Latency Mean**: 0.22 ms
- **Latency P99**: 3 ms

## Summary
- Profiling completed successfully.
- Detailed JSON results saved to: `performance/results/phase4-2026-04-21.json`
