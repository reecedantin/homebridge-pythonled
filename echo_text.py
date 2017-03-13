import sys

sys.stdout.write("started")

while True:
    sys.stdout.write(sys.stdin.read(10))
    sys.stdout.write("recieved")
