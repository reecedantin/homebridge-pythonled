import sys

while True:
    line = raw_input()    # Read a line from file
    print(line)

sys.stdin = sys.__stdin__    # Reset the stdin to its default value
