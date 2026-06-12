# Adapters

Adapters are a concept of enabling `READ_ONLY` access to any media source (ie: local media & online media via servers).

## Design

An [`Adapter`](./core/types.ts#L110) is essentially an object which exposes callbacks returning common data structures specified by the [`MediaLibrary` namespace](./core/types.ts#L7). We'll then merge all the callbacks from the different adapters in order to expose a single implementation of the callback that will be used throughout the app to query data.

If a callback isn't supported by an adapter, we can leave a "stub" (ie: data representing no results found) or throw an error. An example of "stubs" can be seen in the [`ExampleAdapter`](./Example/index.ts).

## Potential Issues & Concerns

With this new concept in mind, there leaves a ton of issues left unanswered:

- How should we handle lyrics & waveforms since we "cache" them in our local database due to being "expensive" to calculate?
  - One potential solution for lyrics is to **drop the table & editing capabilities** and opt to temporarily cache the lyrics for the current track in the Zustand store.
  - We would still want to cache the waveform data as it's **really expensive to calculate, along with it blocking the thread**.
- How would we get this working in Android Auto?
  - It would make sense to display media obtainable from all of our adapters in Android Auto in some capacity.
- How would authentication (and its persistence) work, since that is necessary for supporting online media?
  - We would most likely want to store credentials in a secure store and indicate its status within the adapter itself (ie: expose an `authenticate()` function within, which self-updates a boolean field in the adapter).
- To what extent do we want to merge content from these different adapters? Should we treat content returned from each adapter as separate, unique entities?
  - If we treat each entity as "unique", things become a bit simpler due to:
    - Routing being extremely easy (ie: `/artist/:adapter/:id`).
    - Being able to preserve current sorting capabilities on the tracks displayed in the "All Tracks", "Current Artist", "Current Folder", and "Current Genre" screens.
- Does our current adapter structure cover all of our needs?
  - One thing we might remove for example is the `getFolder()` & `getTracks()` functions.
- Do we want to eventually add `WRITE` access via our adapters? The only thing that will probably be supported is playlist modification & favoriting.
  - Things might get pretty complicated as we would need to ensure content doesn't get mixed (though this would mean we would need to go with the approach which treats all entities as "unique").

In addition, we will most likely need to:

- "Dumb down" our components to not be overly reliant on local database calls.
- Simplify the onboarding logic / implementation.
- Simplify our UI in case the data we have access to is too constrained.

Due to the abstractness of adapters, we will end up passing more data to components & screens, which may cause slowdowns in rendering.

## Potential Online Adapters

A potential list of online adapters that maybe could be implemented:

- Subsonic / OpenSubsonic / Navidrome
  - https://www.subsonic.org/pages/api.jsp
  - https://opensubsonic.netlify.app/docs/opensubsonic-api
  - https://www.navidrome.org/docs/developers/subsonic-api
- Jellyfin
  - https://api.jellyfin.org
