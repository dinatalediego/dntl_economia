"""Tiny Hopfield associative-memory demonstration inspired by Nobel Physics 2024.

Uses bipolar vectors {-1, +1}, Hebbian weights and asynchronous recall.
No third-party dependencies.
"""


def train(patterns):
    n = len(patterns[0])
    weights = [[0 for _ in range(n)] for _ in range(n)]
    for pattern in patterns:
        if len(pattern) != n:
            raise ValueError("All patterns must have the same length")
        for i in range(n):
            for j in range(n):
                if i != j:
                    weights[i][j] += pattern[i] * pattern[j]
    return weights


def recall(weights, state, max_steps=10):
    current = list(state)
    for _ in range(max_steps):
        changed = False
        for i in range(len(current)):
            field = sum(weights[i][j] * current[j] for j in range(len(current)))
            new_value = 1 if field >= 0 else -1
            if new_value != current[i]:
                current[i] = new_value
                changed = True
        if not changed:
            break
    return current


def demo():
    patterns = [
        [1, 1, 1, -1, -1, -1],
        [1, -1, 1, -1, 1, -1],
    ]
    weights = train(patterns)
    target = patterns[0]
    corrupted = target.copy()
    corrupted[2] *= -1
    recovered = recall(weights, corrupted)
    return {
        "target": target,
        "corrupted": corrupted,
        "recovered": recovered,
        "exact_recovery": recovered == target,
    }


if __name__ == "__main__":
    result = demo()
    print("Hopfield associative memory | synthetic demonstration")
    print("Target:    ", result["target"])
    print("Corrupted: ", result["corrupted"])
    print("Recovered: ", result["recovered"])
    print("Recovered exactly:", result["exact_recovery"])
