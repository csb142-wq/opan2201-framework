# Site text

This file holds the page's own wording: the header, the intro, and the text for
each section of the site. It is separate from the model profiles file, which holds
the content for each modeling tool. Between the two files, every word shown on the
site is editable here, without touching any code. Edit a line below, reload, and
the site updates.

Keep the `## ` section headings and the `#### ` field headings as they are. Change
only the text beneath a `#### ` heading.

## Page

#### Browser tab title
OPAN 2201 · Model Selection Framework

#### Page description
A guide to choosing the right modeling tool for a business problem — OPAN 2201.

#### Skip link
Skip to content

#### Loading
Loading the framework…

## Header

#### Eyebrow
OPAN 2201 · Modeling Analytics

#### Title
Model selection framework

#### Intro
This guide helps you identify the right modeling tool for your business problem and explains the reasoning behind each choice. Start with the decision tree, answer the questions posed at each node, and determine the best model type for your problem.

## Decision tree section

#### Heading
Decision Tree

#### Intro
Start with your objective. Each fork below asks one question: follow your answers to the model that fits, then click in to see what to build.

#### Accessible label
Model selection decision tree

## Groups

The two branches of the tree. Each has a label and a short caption shown beneath
it.

#### Describe label
Descriptive

#### Describe caption
I'm want to summarize historical data, identify patterns, or explore possible future scenarios without recommending an action.

#### Decide label
Prescriptive

#### Decide caption
I want to find the optimal choice given my constraints and objectives to produce a specific recommendation.

## Questions

The question shown at each fork in the decision tree. Change the wording freely;
the answers below each question stay the same.

#### What do you need
Am I trying to understand the data, or am I trying to choose the best solution?

#### Inputs uncertain
Am I only describing what the data shows, or am I experimenting with uncertainty to see what could happen? 

#### Everything linear
Are ALL my objective functions and constraints linear, or do they have even one nonlinearity?

#### Variable type
Does my model require any further restraints than just total linearity?

#### Whole number or yes-no
Must any of my variables be a whole number or require a "yes or no" choice?

## Tree subtitles

A short line shown beneath each model box in the decision-tree diagram. The
`#### ` heading names the box; the text beneath it is the caption. Leave a caption
blank to show only the box's title.

#### Descriptive
I am trying to summarize or identify trends in past data.

#### Simulation
I want to explore a range of future possibilities based on past data.

#### LP
No, there are no further constraints.

#### NLP
No, there are no further constraints.

#### IP
At least one of my variables must be a whole number.

#### BP
At least one of my variables either occurs or it doesn’t.

#### MINLP
Yes, at least one of my variables faces a binary or integer constraint.

## Optimization overview

#### Choose a path heading
Choose a path

#### Linear label
Linear

#### Linear description
Every relationship is proportional: each variable is only multiplied by a
constant and added to the others. Nothing curves.

#### Nonlinear label
Nonlinear

#### Nonlinear description
A relationship curves: a variable is squared, two variables are multiplied, or a
logarithm is involved.

#### Options label
Models

## Model page

#### Reasoning note
Expand the dropdowns to learn more about this model's limitations, tradeoffs, and ethical considerations.

#### Back to tree
Decision tree

#### Breadcrumb separator
›

