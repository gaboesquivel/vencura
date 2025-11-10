# Dynamic’s Take Home (Frontend)

Hello 👋

You’ve heard of Wordle? At Dynamic we are all huge fans of Wordle

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/68358aae-c25e-4d9c-ad8d-ddcc55756bd7/Untitled.png)

Well, let’s build [Mathler](https://www.mathler.com/). Like Wordle but with numbers. The user has 6 guesses to try and find the equation that equals a number. The number changes every day. (e.g Find the hidden calculation that equals 12)

**[Sample list of daily puzzles](https://gist.github.com/fredericboivin/79520252fc89cf861485f88d6492c78d)**

**Requirements:**

- Should use Dynamic SDK for user to log-in and store the user’s history in `metadata` , see [this hook](https://docs.dynamic.xyz/react-sdk/hooks/useuserupdaterequest)
- Numbers and operators can appear multiple times.
- Order of operation applies (\* and / are calculated before + and -)
- Should accept cumulative solutions (e.g. 1+5*15 === 15*5+1)
- After each guess, the color of the tiles should change to reflect the status
  - green if it’s in the right spot
  - yellow if it’s is part of the equation but in the wrong spot
  - grey if it’s not part of the equation at all
- Surprise us with something crypto related! A few ideas:
  - mint an NFT to the user's embedded wallet the first time a user solves equation
  - user earns tokens every time they solve a puzzle
  - add an on-ramp (eg. Coinbase, Moonpay) to add tokens to unlock clues, additional tries beyond the 6 guesses, or something else
  - be creative! do something else fun!

We encourage to use what you’re comfortable with as long as it’s JavaScript. Internally, we use TypeScript, Node and React but our core product needs to work seamlessly with many different build tools and frameworks so proficiency beyond React is important.

## What we look for

Some helpful tips to help you prioritize

### Testing

We think good code is code that can be tested easily. The solution should include reasonable test coverage and we’ll be evaluating the test suite along these lines:

- Mock usage: What are you mocking and why? Mocks are powerful but they add complexity. Used incorrectly, they can make tests brittle and hide bugs
- What are you choosing to test and where: The distinction between unit and integration tests can be blurry. We want to know what you think is important to test and how you’re balancing the competing priorities

### UX

Controlling the game should be done with the mouse and keyboard.

We suggest spending enough time on design & UX to showcase your frontend skills (something that you would feel proud sharing publicly). Remember you’re building a simple game - try making it fun 🙂 .

Beyond that, the problem can be taken in any direction you’d like. We’re not looking for one specific solution. We want to see your approach to solving the problem as well as the quality of the code you’re writing and the reasoning behind the decisions.
