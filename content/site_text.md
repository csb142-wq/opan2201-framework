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
OPAN 2201 · Model selection framework

#### Page description
A guide to choosing the right modeling tool for a business problem — OPAN 2201.

#### Skip link
Skip to content

#### Loading
Loading the framework…

#### Footer
The site's wording lives in the two files under `content/` — `site_text.md` for
the page itself and `tool_profiles.md` for the models. Editing those files is the
only step needed to change any wording on this site.

## Header

#### Eyebrow
OPAN 2201 · Modeling Analytics

#### Title
Model selection framework

#### Intro
A guide to choosing the right modeling tool for a business problem, and
understanding why. Start from the decision tree, then open any model to see what
to build and the reasoning behind it.

## Decision tree section

#### Heading
Decision tree

#### Intro
Start with what you are trying to do. That choice sets the paradigm: describe,
optimize, or simulate. Inside optimization, two further questions narrow the
choice: is the relationship linear or nonlinear, and must a decision variable be a
whole number or a yes or no value?

#### Accessible label
Model selection decision tree

#### Paradigm label
Paradigm

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

#### Leads to label
Starts with

#### Narrows to label
then narrows to

## Model page

#### Reasoning note
The reasoning — limitations, tradeoffs, ethics, and model-specific detail. Open
what you need.

#### Where to go next heading
Narrow further

#### Back to tree
Decision tree

#### Breadcrumb separator
›

## Next-step offers

These lines describe when to continue from one model to a more specific one. The
`#### ` heading is the target model's abbreviation; the text beneath it is the
condition shown to the student.

#### IP
A decision variable must be a whole number, such as a count or a fixed increment.

#### BP
The decision is yes or no — whether to include an option at all.

#### MINLP
The problem is nonlinear and a decision variable must also be a whole number or a
yes or no value.
