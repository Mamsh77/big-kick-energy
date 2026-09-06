export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Get everyone's saved availability
    if (url.pathname === "/api/availability" && request.method === "GET") {
      const results = await env.DB
        .prepare("SELECT player, game_date, status, updated_at FROM availability")
        .all();

      return Response.json(results.results);
    }

    // Save or change a player's availability
    if (url.pathname === "/api/availability" && request.method === "POST") {
      const { player, game_date, status } = await request.json();

      const validStatuses = ["available", "unsure", "unavailable"];

      if (!player || !game_date || !validStatuses.includes(status)) {
        return Response.json(
          { error: "Invalid availability data" },
          { status: 400 }
        );
      }

      await env.DB
        .prepare(`
          INSERT INTO availability (player, game_date, status)
          VALUES (?, ?, ?)
          ON CONFLICT(player, game_date)
          DO UPDATE SET
            status = excluded.status,
            updated_at = CURRENT_TIMESTAMP
        `)
        .bind(player, game_date, status)
        .run();

      return Response.json({ success: true });
    }

    // Anything that isn't /api/availability is the normal website
    return env.ASSETS.fetch(request);
  }
};
