# hass-wunderlist

Tested with home assistant version 0.91

In this repo there are three modules:

1. Generic todo list component, for fetching/creating/updating items
2. A wunderlist platform implementation for the todo list component
3. A generic todo-list-card which can display the todo list items, platform independently

All this work is based on the current hass shopping list component, wunderlist component and shopping list card.  

## Installation

Add to your `configuration.yaml`:

```
custom_updater:
  component_urls:
    - https://raw.githubusercontent.com/pallost/hass-wunderlist/master/custom_components.json
    
todolist:
  - platform: wunderlist
    client_id: !secret wunderlist_client_id
    access_token: !secret wunderlist_access_token
    lists:
      - list_id: 123456789
        name: "My Groceries list"
      - list_id: 987654321
        name: "Favorite movies"
```

And in your `ui-lovelace.yaml`:

```
resources:
  - url: /customcards/github/pallost/todo-list-card.js?track=true
    type: js

[...]

cards:
  - type: custom:todo-list
    title: Groceries
    entity: todolist.my_groceries_list
    show_completed: false

  - type: custom:todo-list
    title: Movies
    entity: todolist.favorite_movies
    show_completed: true
```

## Development

As I probably won't have time to actively develop this component, platform and lovelace card, but feel free to fork
this repository or do pull requests.


