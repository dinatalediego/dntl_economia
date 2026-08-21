"""Minimal reproducible Difference-in-Differences demo inspired by Nobel Economics 2021.

No third-party dependencies. The numbers are synthetic by design: the goal is to
make identification logic inspectable before applying it to real observational data.
"""
from statistics import mean


def difference_in_differences(treated_pre, treated_post, control_pre, control_post):
    """Return the 2x2 Difference-in-Differences decomposition."""
    treated_before = mean(treated_pre)
    treated_after = mean(treated_post)
    control_before = mean(control_pre)
    control_after = mean(control_post)

    treated_change = treated_after - treated_before
    control_change = control_after - control_before
    effect = treated_change - control_change
    counterfactual_treated_after = treated_before + control_change

    return {
        "treated_pre": treated_before,
        "treated_post": treated_after,
        "control_pre": control_before,
        "control_post": control_after,
        "treated_change": treated_change,
        "control_change": control_change,
        "counterfactual_treated_post": counterfactual_treated_after,
        "did_effect": effect,
    }


def demo():
    # Synthetic outcome: e.g. monthly sales per comparable unit/market.
    treated_pre = [20, 22, 19, 21]
    treated_post = [28, 30, 29, 31]
    control_pre = [18, 20, 17, 19]
    control_post = [20, 22, 19, 21]
    return difference_in_differences(
        treated_pre, treated_post, control_pre, control_post
    )


if __name__ == "__main__":
    result = demo()
    print("Difference-in-Differences | synthetic demonstration")
    print(f"Treated change:      {result['treated_change']:.2f}")
    print(f"Control change:      {result['control_change']:.2f}")
    print(f"Counterfactual post: {result['counterfactual_treated_post']:.2f}")
    print(f"Estimated effect:    {result['did_effect']:.2f}")
