-- Mock data for permission metrics tables
-- This script inserts sample data for testing the Permission Monitoring Dashboard

-- Cache performance metrics
INSERT INTO permission_metrics_cache (timestamp, hits, misses)
VALUES
  (NOW() - INTERVAL '24 hours', 250, 50),
  (NOW() - INTERVAL '22 hours', 300, 45),
  (NOW() - INTERVAL '20 hours', 280, 55),
  (NOW() - INTERVAL '18 hours', 320, 40),
  (NOW() - INTERVAL '16 hours', 340, 35),
  (NOW() - INTERVAL '14 hours', 310, 30),
  (NOW() - INTERVAL '12 hours', 290, 25),
  (NOW() - INTERVAL '10 hours', 350, 30),
  (NOW() - INTERVAL '8 hours', 380, 40),
  (NOW() - INTERVAL '6 hours', 400, 35),
  (NOW() - INTERVAL '4 hours', 420, 30),
  (NOW() - INTERVAL '2 hours', 450, 25),
  (NOW(), 480, 20);

-- Permission checks metrics
INSERT INTO permission_metrics_checks (timestamp, successful, denied, avg_latency)
VALUES
  (NOW() - INTERVAL '24 hours', 180, 20, 12.5),
  (NOW() - INTERVAL '22 hours', 195, 15, 11.8),
  (NOW() - INTERVAL '20 hours', 210, 18, 12.2),
  (NOW() - INTERVAL '18 hours', 225, 12, 10.5),
  (NOW() - INTERVAL '16 hours', 230, 10, 9.8),
  (NOW() - INTERVAL '14 hours', 245, 8, 9.2),
  (NOW() - INTERVAL '12 hours', 260, 9, 9.5),
  (NOW() - INTERVAL '10 hours', 275, 7, 8.9),
  (NOW() - INTERVAL '8 hours', 290, 8, 9.1),
  (NOW() - INTERVAL '6 hours', 300, 5, 8.5),
  (NOW() - INTERVAL '4 hours', 310, 4, 8.2),
  (NOW() - INTERVAL '2 hours', 325, 3, 7.9),
  (NOW(), 335, 2, 7.5);

-- Role management metrics
INSERT INTO permission_metrics_roles (timestamp, assignments, removals)
VALUES
  (NOW() - INTERVAL '24 hours', 5, 2),
  (NOW() - INTERVAL '22 hours', 3, 1),
  (NOW() - INTERVAL '20 hours', 4, 0),
  (NOW() - INTERVAL '18 hours', 2, 3),
  (NOW() - INTERVAL '16 hours', 6, 1),
  (NOW() - INTERVAL '14 hours', 4, 2),
  (NOW() - INTERVAL '12 hours', 3, 1),
  (NOW() - INTERVAL '10 hours', 5, 0),
  (NOW() - INTERVAL '8 hours', 7, 2),
  (NOW() - INTERVAL '6 hours', 4, 3),
  (NOW() - INTERVAL '4 hours', 3, 1),
  (NOW() - INTERVAL '2 hours', 6, 2),
  (NOW(), 4, 1);

-- Security events metrics
INSERT INTO permission_metrics_security (timestamp, unauthorized_attempts, type)
VALUES
  (NOW() - INTERVAL '24 hours', 3, 'access_denied'),
  (NOW() - INTERVAL '22 hours', 1, 'invalid_token'),
  (NOW() - INTERVAL '20 hours', 2, 'role_insufficient'),
  (NOW() - INTERVAL '18 hours', 0, null),
  (NOW() - INTERVAL '16 hours', 1, 'expired_token'),
  (NOW() - INTERVAL '14 hours', 0, null),
  (NOW() - INTERVAL '12 hours', 1, 'access_denied'),
  (NOW() - INTERVAL '10 hours', 2, 'role_insufficient'),
  (NOW() - INTERVAL '8 hours', 0, null),
  (NOW() - INTERVAL '6 hours', 1, 'invalid_token'),
  (NOW() - INTERVAL '4 hours', 0, null),
  (NOW() - INTERVAL '2 hours', 0, null),
  (NOW(), 1, 'access_denied');

-- Edge function metrics
INSERT INTO permission_metrics_edge (timestamp, calls, errors, latency)
VALUES
  (NOW() - INTERVAL '24 hours', 150, 5, 85.2),
  (NOW() - INTERVAL '22 hours', 165, 4, 83.7),
  (NOW() - INTERVAL '20 hours', 180, 6, 84.5),
  (NOW() - INTERVAL '18 hours', 195, 3, 82.1),
  (NOW() - INTERVAL '16 hours', 210, 4, 81.8),
  (NOW() - INTERVAL '14 hours', 225, 2, 80.5),
  (NOW() - INTERVAL '12 hours', 240, 3, 79.2),
  (NOW() - INTERVAL '10 hours', 255, 5, 78.5),
  (NOW() - INTERVAL '8 hours', 270, 2, 77.9),
  (NOW() - INTERVAL '6 hours', 285, 1, 76.3),
  (NOW() - INTERVAL '4 hours', 300, 2, 75.8),
  (NOW() - INTERVAL '2 hours', 315, 3, 74.5),
  (NOW(), 330, 1, 73.2);

-- Alerts
INSERT INTO permission_metrics_alerts (id, severity, message, timestamp, acknowledged)
VALUES
  (gen_random_uuid(), 'high', 'Multiple unauthorized access attempts detected from IP 192.168.1.100', NOW() - INTERVAL '23 hours', false),
  (gen_random_uuid(), 'medium', 'Cache hit rate below threshold (70%) for more than 30 minutes', NOW() - INTERVAL '20 hours', true),
  (gen_random_uuid(), 'low', 'Edge function latency increased by 20% in the last hour', NOW() - INTERVAL '18 hours', true),
  (gen_random_uuid(), 'critical', 'Security token validation failures detected for multiple users', NOW() - INTERVAL '12 hours', false),
  (gen_random_uuid(), 'medium', 'Role assignment rate exceeds normal threshold', NOW() - INTERVAL '8 hours', false),
  (gen_random_uuid(), 'high', 'Permission check failure rate above 10% in the last hour', NOW() - INTERVAL '4 hours', false);