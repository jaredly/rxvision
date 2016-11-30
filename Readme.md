**Maintenance status:** low. I'm not currently using this or RxJS, but I'm happy to review & merge pull requests if you want to make improvements.

-----

**Completion status:** Prototype. I got something working that worked well for demos, but wasn't really sufficient for large app-sized use cases. It also hasn't been updated to the latest versions of RxJS.

-----

# Take off the blindfold

[![Join the chat at https://gitter.im/jaredly/rxvision](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/jaredly/rxvision?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

It's easier to understand what's happening if you can look at it.

`rxvision` is a tool to visualize and debug your RxJS reactive streams.

[![screenshot](http://jaredly.github.io/images/pasted-16.png)](https://jaredly.github.io/rxvision)

# The Demo [(see it live)](https://jaredly.github.io/rxvision)

You'll need `webpack` installed globally (`npm install -g webpack`).

```
npm install
webpack
```

Then you need to run a static server (so ajax will work in the demo). I use
`http-server` (`npm install -g http-server`):

```
http-server -p 4321
```

then open http://localhost:4321/examples/gh-follow/index.html in a browser.

# Usage

Check out the `gh-follow` source, or play with the playground [here](http://jaredly.github.io/rxvision/examples/playground/).


