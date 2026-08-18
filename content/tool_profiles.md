# OPAN 2201 modeling tool selection framework: tool profiles

This file contains the tool profiles for the modeling tool selection framework
(MORE Program deliverable #2). It is the single source of content for the
framework. The website is generated from this file, so any edit made here updates
the site. The structure below is the same for every model, which keeps the
profiles consistent and allows the site build to read them.

## File structure

Each model is profiled using the same fields, in the same order. The fields are
grouped by how they appear on the site.

Fields shown by default: Definition, When to use it, When to use a different
model, and Recommended tool. These give a student enough information to select a
model and begin building.

Fields shown in expandable sections, marked "(expandable)": the reasoning behind
the model, including Limitations and common misuses, Key tradeoffs, and Ethical
considerations and uncertainty. A student who has already chosen a model can skip
these. Some models add further expandable sections, such as variable type, how
the solver works, or verifying the solution, where they are useful. Simpler
models use few or none.

Field headings, used exactly as written so the site build can map them:

1. Definition
2. When to use it
3. When to use a different model, given as a list of the form "If [condition], use [model]"
4. Limitations and common misuses (expandable)
5. Key tradeoffs (expandable)
6. Ethical considerations and uncertainty (expandable)
7. Recommended tool

Any additional model-specific section is also marked "(expandable)".

---

# Descriptive

Descriptive is the base model type. It is deterministic and built in Excel, and it
answers the question of what happened. A descriptive model organizes known data
and computes on it, but it does not recommend a decision or account for
uncertainty. Forward projection also belongs here, since extending values with a
growth rate is descriptive work rather than forecasting under uncertainty.

## Descriptive modeling

*Tag: descriptive*

#### Definition
A descriptive model organizes and computes on known data to describe a situation,
producing totals, averages, or projections. It does not recommend a decision or
model uncertainty.

#### When to use it
Use a descriptive model to summarize what the data shows from fixed, known inputs.
This includes computing an outcome, tracking a metric, or projecting a value
forward at an assumed growth rate. The inputs are treated as fixed, and the goal
is calculation rather than a recommended decision. In the GWM case, a descriptive
model computes the total return for a given portfolio allocation, or projects
costs forward year over year at a fixed growth rate, as in the GT Coffee Roasters
example.

#### When to use a different model
- If the goal is the best allocation or decision rather than a computed result, use Optimization.
- If the inputs are genuinely uncertain and a range of outcomes is needed, use Simulation.

#### Limitations and common misuses (expandable)
Descriptive models describe. They do not prescribe a decision or predict an
uncertain future. The most common misuse is presenting a projection as a forecast,
since carrying a growth rate forward produces a definite-looking number that is
still only an assumption about the future. A related mistake is reading a single
computed scenario as the full picture when a data table would show how sensitive
the result is to its inputs. As with any analysis, a correlation in the data does
not establish causation.

#### Key tradeoffs (expandable)
Descriptive modeling is the most transparent and accessible model type, because
the Excel grid shows every input and formula. That transparency is also its limit.
A descriptive model cannot optimize a decision and cannot quantify uncertainty.
Its simplicity is both its main advantage and its boundary.

#### Ethical considerations and uncertainty (expandable)
Even a simple descriptive model contains choices about which inputs to include,
which formulas to apply, and how to aggregate the results, and those choices shape
the conclusion. A projection carried forward at a fixed rate can appear certain
when it is only an assumption, so presenting it as a firm prediction overstates
what is known. A selective baseline or a misleading average can distort the
picture as easily as a more complex model. The appropriate practice is to state
the inputs and assumptions clearly and, where it matters, to show the sensitivity
of the result using a data table.

#### Recommended tool
Excel: the grid, formulas, and what-if tools are suited to this work. Data tables
provide one- and two-input sensitivity analysis, and Goal Seek reverse-calculates
the input that produces a target output, such as a breakeven point. 

---

# Optimization

The five models below share one question: what is the best decision available
under a set of constraints? They are distinguished first by whether the
relationships are linear or nonlinear, and then by whether any decision variable
must be a whole number or a yes or no value. The "When to use a different model"
list directs a student to the correct model if they have started in the wrong one.

---

## Linear programming (LP)

*Tag: optimization / LP*

#### Definition
A linear program finds the best way to allocate a continuous resource in order to
maximize or minimize a linear objective, subject to linear constraints.

#### When to use it
Use a linear program when the decision is how much of a divisible quantity to
allocate, such as dollars, hours, or budget share. Every relationship must be
linear, meaning each variable is only multiplied by a constant and added to the
others. The inputs are fixed estimates, and the goal is a single best answer
rather than a range. In the GWM case, a linear program allocates $10M across asset
classes to maximize expected return, subject to the per-class caps and the
requirement that all funds are invested.

#### When to use a different model
- If a variable must be a whole number, such as investing in $150k increments, use IP.
- If the decision is whether to include an option at all, a yes or no choice, use BP.
- If a relationship is nonlinear, such as a risk penalty that grows with the square of an allocation, use NLP.
- If the inputs are genuinely uncertain and a range of outcomes is needed, use Simulation.

#### Limitations and common misuses (expandable)
A linear relationship is often a simplification of reality, and forcing a curved
relationship to be straight can produce a confident but incorrect answer. A more
frequent problem is accepting the optimal solution without sensitivity analysis.
Linear program solutions occur at the intersection of constraints, so a small
change in an input can move the recommendation sharply. Two further mistakes are
running Excel Solver past its size limit and accepting a weaker solution instead
of moving to PuLP, and modeling an integer decision as continuous and then
rounding, since a rounded fractional solution is not guaranteed to be optimal or
even feasible.

#### Key tradeoffs (expandable)
A linear program is the most tractable, fastest, and most easily explained
optimization model. The cost of that simplicity is the linearity assumption. The
model returns one clear optimal answer but gives no indication of how stable that
answer is, which is why sensitivity analysis is important here. At the tool level,
Excel Solver shows the mechanics clearly, while PuLP offers scale and
reproducibility.

#### Ethical considerations and uncertainty (expandable)
The result of a linear program, such as a specific dollar allocation, appears
authoritative, but it depends on inputs that the modeler has acknowledged are
estimates. Presenting the single solution without its sensitivity overstates how
certain the recommendation is. The decision to model the problem as linear is
itself an assumption that affects the answer, and factors left out, such as
curvature, correlation, or risk, bias the result. The appropriate practice is to
report how the recommendation changes as key inputs vary. In a client memo, this
means presenting the sensitivity analysis alongside the recommended allocation.

#### Recommended tool
Use Excel Solver with the Simplex LP method when the problem is small and its
structure should be visible to stakeholders in the cells. Move to PuLP when the
problem is larger or when it requires automation or scalability. 

---

## Integer programming (IP)

*Tag: optimization / IP*

#### Definition
An integer program finds the best allocation when all relationships are linear but
at least one decision variable must be a whole number.

#### When to use it
Use an integer program when the decision is how many of something indivisible,
such as units bought in fixed increments, people assigned, or machines run, and a
fractional answer would have no meaning. Every relationship is still linear, so the
only change from a linear program is that one or more variables are restricted to
whole numbers. In the GWM case, the client can only invest in $150k increments, so
the decision becomes how many increments to place in each asset class.

#### When to use a different model
- If the variables can be fractional after all, use LP.
- If the decision is whether to include an option, a yes or no choice, use BP.
- If a relationship is nonlinear, use NLP, or MINLP if a variable is also an integer.
- If the inputs are genuinely uncertain and a range of outcomes is needed, use Simulation.

#### Variable type (expandable)
An integer program requires at least one integer variable, meaning a whole-number
count or number of increments. Other variables can remain continuous. A single
integer requirement is enough to make the entire problem an integer program.

#### Limitations and common misuses (expandable)
Integer problems are considerably harder to solve than linear ones. The set of
possible solutions is no longer continuous, so the solver must search rather than
move smoothly toward an answer, and solving time grows quickly as the problem gets
larger. Excel Solver can reach its iteration or subproblem limit and return the
best solution it has found rather than a proven optimum. The most common misuse is
solving the linear version and rounding the result, because a rounded answer can
be infeasible or can leave value unused. The integer optimum is generally not the
linear optimum with its values rounded.

#### Key tradeoffs (expandable)
An integer program gains realism, since indivisible quantities are respected, at
the cost of a harder computation. The best integer solution can be measurably
worse than the linear bound, and that difference is a real feature of the problem
rather than a solver error. It is worth confirming that the indivisibility
actually affects the decision before accepting that additional cost.

#### Ethical considerations and uncertainty (expandable)
An integer program carries the same risk as a linear program of overstating
certainty in a single solution, with an added complication. The reported optimum
may in fact be the best solution found within the solver's limits rather than a
proven optimum, and presenting a solution stopped at a tolerance as proven
misrepresents it. As always, the inputs that drive the allocation are estimates,
so the recommendation should be accompanied by a sensitivity check rather than a
single figure.

#### Verifying the solution (expandable)
The characteristic failure of an integer program is the solver returning
fractional values because the integer constraint was not enforced. In Excel
Solver, confirm that "Ignore Integer Constraints" is unchecked under Options, All
Methods, and review the Integer Optimality percentage. A nonzero value means the
solver stopped at a near-optimal solution rather than a proven one. In PuLP,
integer problems sometimes require the PULP_CBC_CMD solver to be specified.

#### Recommended tool
Excel Solver with an integer constraint when the problem is small and its
structure should be visible. Move to PuLP with LpInteger when the problem is
larger, and specify PULP_CBC_CMD if the integer solve does not behave as expected.

---

## Binary programming (BP)

*Tag: optimization / BP*

#### Definition
A binary program selects which options to include, where each decision takes a
value of one or zero, in order to best meet a linear objective.

#### When to use it
Use a binary program when the decision is one of selection or inclusion, such as
which asset classes to hold, which projects to fund, or which facilities to open.
At least one variable is binary, taking a value of one or zero, and the model
often includes logical conditions, such as including at most three of four
options. In the GWM case, the client wants their money split across at most three
of the four asset classes, and the model determines which three to include.

#### When to use a different model
- If the decision is how much, a continuous amount, use LP.
- If the decision is how many whole units rather than yes or no, use IP.
- If a relationship is nonlinear, use NLP, or MINLP if a variable is also binary.
- If the inputs are genuinely uncertain and a range of outcomes is needed, use Simulation.

#### Variable type (expandable)
A binary program is a special case of integer programming in which variables are
restricted to one or zero. That restriction is what allows the model to represent
yes or no inclusion and logical rules, such as "if this, then that" or "at most k
of n," which a linear or general integer program cannot express directly.

#### Limitations and common misuses (expandable)
Binary variables allow useful logic, but the number of possible combinations grows
rapidly as options are added, so solving time can increase sharply. A common
formulation problem is the "big-M" pattern used to turn constraints on and off. A
value of M that is too large causes numerical instability, while a value that is
too small removes valid solutions. A further misuse is choosing binary variables
when a simpler continuous model would answer the question.

#### Key tradeoffs (expandable)
A binary program provides expressiveness, since it can represent choices and
conditions that no continuous model can. The cost is combinatorial difficulty and
careful formulation. The more yes or no decisions the model contains, the harder
it is to solve and the easier it is to specify the logic incorrectly.

#### Ethical considerations and uncertainty (expandable)
Selection models contain an implicit choice about which options were considered in
the first place. The best three of four options is only as sound as the four
options that were offered, and any excluded alternative does not appear in the
result. The way the option set is defined therefore carries as much weight as the
optimization itself. The candidate set should be stated explicitly rather than
presented as though it were complete.

#### Verifying the solution (expandable)
A binary program shares the integer constraint check. Confirm that Solver is
enforcing the binary constraint and that the optimality gap is understood. In
addition, test that logical constraints behave correctly at the extremes, for
example that a limit of at most three genuinely excludes the fourth option, since
big-M and either-or formulations can fail without warning.

#### Recommended tool
Excel Solver with a binary constraint when the problem is small and its structure
should be visible. Move to PuLP with LpBinary when the problem is larger or the
selection logic is more involved.

---

## Nonlinear programming (NLP)

*Tag: optimization / NLP*

#### Definition
A nonlinear program finds the best continuous allocation when the objective or a
constraint is nonlinear, for example when a variable is squared, two variables are
multiplied, or a logarithm is involved.

#### When to use it
Use a nonlinear program when relationships curve rather than stay proportional,
such as diminishing returns, economies of scale, or a risk penalty that grows
faster as more is concentrated in one place. All variables are continuous, with no
whole-number or yes or no requirement. It is the form of the mathematics that has
changed, not the type of the variables. In the GWM case, a nonlinear program
maximizes a risk-adjusted return in which risk is a quadratic penalty on each
allocation, so that doubling an allocation more than doubles its risk cost.

#### When to use a different model
- If every relationship is in fact linear, use LP, or IP or BP if a variable is integer or binary.
- If the problem is nonlinear and a variable must also be integer or binary, use MINLP.
- If the inputs are genuinely uncertain and a range of outcomes is needed, use Simulation.

#### How the solver works (expandable)
SciPy's minimize function, using the SLSQP method, performs a local search. It
begins at the initial guess x0 and follows the slope of the function to the
nearest optimum. As a result, the answer can depend on the starting point, and the
solver can settle at a local optimum without finding a better one elsewhere. This
is the main difference from basinhopping, used for MINLP, which searches globally.
Note also that SciPy only minimizes, so a maximization is written by minimizing
the negative of the objective.

#### Limitations and common misuses (expandable)
The main limitation is the difference between a local and a global optimum. The
minimize function returns a local optimum tied to the starting point, so reporting
it as the overall optimum can be incorrect. A sound practice is to test several
starting points and confirm that they converge to the same solution. Other common
errors are forgetting to negate the objective for a maximization and
underestimating how sensitive convergence is to the bounds and to the scaling of
the variables.

#### Key tradeoffs (expandable)
A nonlinear program captures curvature that a linear program cannot, which makes
the model more realistic. In exchange, it gives up the guarantee of a global
optimum and becomes sensitive to its setup, including the starting point, the
bounds, and the method. The model gains realism and loses certainty that the true
best solution has been found.

#### Ethical considerations and uncertainty (expandable)
The local optimum issue is itself a matter of honest reporting, since presenting a
result that depends on the starting point as definitive overstates what the model
found. The nonlinear form is also a modeling choice with significant influence.
The risk-penalty coefficient, for instance, largely determines the recommendation,
so it should be stated clearly and tested rather than left unexamined.

#### Recommended tool
Python with SciPy, using the minimize function with the SLSQP method, explicit
bounds and constraints, and a valid starting point. Excel is not a practical tool
for nonlinear optimization at this level, so this model is built in Python.

---

## Mixed integer nonlinear programming (MINLP)

*Tag: optimization / MINLP*

#### Definition
A mixed integer nonlinear program is the most difficult case, combining a
nonlinear objective or constraint with at least one integer or binary variable.

#### When to use it
Use this model when two conditions hold at once: the mathematics curves, and a
decision must be a whole number or a yes or no value. Either feature on its own
points to a different model. It is the combination that defines a mixed integer
nonlinear program. In the GWM case, the model selects at most three of four asset
classes, a binary decision, while the allocations are subject to a nonlinear risk
penalty, so a binary decision and a nonlinearity appear in the same model.

#### When to use a different model
- If the problem is nonlinear but all variables are continuous, use NLP.
- If a variable is integer or binary but every relationship is linear, use IP or BP.
- If every relationship is linear and every variable is continuous, use LP.
- If the inputs are genuinely uncertain and a range of outcomes is needed, use Simulation.

#### How the solver works (expandable)
A mixed integer nonlinear program does not fit the tools used for the other
models. PuLP requires all relationships to be linear, and the plain minimize
function requires all variables to be continuous, so neither can handle both
features at once. Basinhopping is the method used instead. Rather than following a
single slope, which finds only a local optimum, it repeatedly jumps to random
starting points and runs a local search from each, keeping the best result found.
The whole-number requirement is enforced by rounding inside the objective and the
constraint check, using np.round. Because basinhopping does not accept a
constraints argument in the way the minimize function does, the constraint check
is passed in through a small class structure. Because the starting points are
random, running several seeds and keeping the best result guards against a single
unrepresentative search.

#### Limitations and common misuses (expandable)
Basinhopping is a heuristic global search rather than an exact method, so it does
not prove that a solution is optimal. It returns the best solution it happened to
find. The common misuses follow from this. Relying on a single seed can mislead,
since different seeds can produce different answers. Running too few hops does not
explore the space adequately. And the rounding step used for whole numbers can
produce solutions that quietly violate a constraint if they are not rechecked
after rounding.

#### Key tradeoffs (expandable)
A mixed integer nonlinear program is the only approach here that handles a
nonlinearity and a whole-number requirement together. In exchange, it gives up any
guarantee of optimality. More seeds and more hops improve the chance of a good
result at the cost of computing time, and even then the best solution found is not
a proven best.

#### Ethical considerations and uncertainty (expandable)
Among these models, a mixed integer nonlinear program carries the greatest risk of
overstated certainty, because the result appears to be the optimum but is the best
outcome of a random search. Reporting it without noting that it is heuristic and
depends on the seed overstates certainty more than any other model in the
framework. An honest presentation runs enough seeds to show that the result is
stable and states plainly that it is a strong candidate rather than a proven
optimum.

#### Verifying the solution (expandable)
Because the method is random, the question of whether it worked is answered by the
stability of the result across seeds rather than by a single run. If independent
seeds arrive at the same solution, the result is more trustworthy. If they differ,
run more hops or seeds. Confirm as well that any rounded solution still satisfies
every constraint, since rounding can move a solution just outside the feasible
region.

#### Recommended tool
Python with SciPy, using basinhopping with a local minimizer such as L-BFGS-B,
np.round for the whole-number requirement, a constraint-check class in place of a
constraints dictionary, and several seeds with a sufficient number of hops. This
model is built in Python.

---

# Simulation

Simulation is the stochastic model type, and it is the model the optimization
profiles refer to when the inputs are no longer fixed estimates but are genuinely
uncertain. Where an optimization model asks for the single best decision and a
descriptive model asks what happened, a simulation asks what could happen and how
likely each outcome is.

## Simulation modeling

*Tag: simulation*

#### Definition
A simulation generates many possible outcomes when key inputs are uncertain and
then summarizes the resulting distribution, rather than producing a single answer.

#### When to use it
Use a simulation when the important inputs are not fixed, such as market returns,
demand, or costs, and the goal is to understand the range of
outcomes and their likelihood rather than a single estimate. This is the model
type for assessing risk, including the best case, the worst case, and the chance
of an unfavorable result. In the GWM case, a simulation evaluates a portfolio
under uncertain asset returns, interest rates, and inflation by generating a
thousand or more performance scenarios and then examining the distribution of
returns and the downside risk.

#### When to use a different model
- If the inputs are in fact fixed estimates and the goal is to summarize them, use Descriptive.
- If the goal is the single best decision under constraints and the inputs are known, use Optimization.
- If a single number to plan around is needed rather than a distribution, Descriptive or Optimization is the better fit.

#### Choosing the distribution (expandable)
When using a simulation model, the user must decide the best distribution for each uncertain
input: 
- Normal distribution: values that cluster around a mean such as returns or
demand
- Triangular distribution: defined by a minimum, most likely, and
maximum value
- Uniform distribution: every value in a range is equally likely
- Discrete distribution: specific values with set probabilities
- Poisson distribution: counts of events in an interval such as arrivals or calls
- Binomial distribution: the number of successes in a fixed number of trials

#### Interpreting the output (expandable)
Because the output is a distribution rather than a single number, it is
interpreted using descriptive statistics:
- The mean is the average and the value to plan around
- The standard deviation measures the spread, or how uncertain the outcome is
- Percentiles give scenario thresholds, with the 5th percentile as a worst case, the
50th as the median, and the 95th as a best case
- The mode identifies the most frequently recurring value

#### Limitations and common misuses (expandable)
A simulation is only as reliable as the distributions chosen for it. A common
misuse is understating the risk in the tails. A distribution with
thin tails makes rare but severe events, such as those in 2008 Financial Crisis, appear
nearly impossible when they are not, and these are often the most important outcomes a 
decision maker needs to see. Other errors include reporting only the mean and hiding
the spread that was the purpose of the model, running too few iterations, and
assuming that uncertain inputs are independent when they are correlated, which a
simple model does not capture. A simulation describes risk. It does not select a
decision.

#### Key tradeoffs (expandable)
A simulation replaces a single answer with a fuller account of uncertainty. That
account is more informative but requires interpretation through percentiles and
ranges rather than a single figure, and it does not itself produce a decision.
The modeler is therefore responsible for choosing the distribution and interpreting 
the results. Additionally, a larger number of iterations increases confidence at 
the cost of computing time.

#### Ethical considerations and uncertainty (expandable)
The value of simulation lies in a complete account of the range of outcomes, and the
results can be manipulated by reporting only certain results, such as reporting only 
the expected value or by selecting distributions that understate the downside. Understating 
the risk in the tails is the most consequential version of this problem, since the tails are 
where the most important decisions are made. The distribution and correlation
assumptions are choices that shape the risk picture and should be stated, and the
output should be communicated using percentiles and worst-case scenarios rather
than an average alone.

#### Recommended tool
Python: use NumPy for vectorized sampling across the np.random distributions, and
SciPy for the t distributions and summary statistics.
Excel: can also run very simple simulations, but not at the number of iterations or the
range of distributions that risk modeling requires, so this model type is best built in
Python.
