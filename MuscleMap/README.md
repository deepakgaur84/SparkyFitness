# MuscleMap

Tap a muscle on a front/back body diagram and get the exercises for it (filter by equipment and level, open one for
pictures and instructions), then jump to SparkyFitness to log it.

- 876 exercises from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain), the same list SparkyFitness offers as "Free Exercise DB".
- Static nginx container. No database, no persistent folders, no secrets.
- Runs as the `musclemap` service in `docker/docker-compose.prod.yml` of this repo.
- `SPARKY_URL` (set from `MUSCLEMAP_SPARKY_URL`, else `SPARKY_FITNESS_FRONTEND_URL`) controls where the "Log in SparkyFitness" buttons go.
- Muscle regions are hand-drawn and simplified. The dataset has no "obliques", so the sides of the abs count as Abs.
