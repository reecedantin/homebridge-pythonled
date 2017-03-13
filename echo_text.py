import sys

while True:
    try:
        line = raw_input()    # Read a line from file
        print(line)
    except:
        print("fail")


sys.stdin = sys.__stdin__    # Reset the stdin to its default value
