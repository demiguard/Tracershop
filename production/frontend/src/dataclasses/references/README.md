# Description

I would like to be able to throw similiar things into a component and that
component should specialize to fit the underlying data.

So I guess we end up with this idea of a references to specialized data in the
database. This is kinda to avoid having a million switch statements.

One of the funny things is that, there exists lot of opinions on how to solve
these problems, however I feel that one the things missing here is just the
recognition that, the problem itself is difficult to solve, and as a result any
solution to the problem is gonna suck, and that isn't the fault of method, but
the problem, which is irreplaceable.

Any-who, the solution I have talked myself into is to create a bunch of interface
classes, that essentially hide the switch statement, inside of the class hiracy
which should also be easier to extend, because you just throw another class on
top, and if there's any missing we just throw a not implemented.
